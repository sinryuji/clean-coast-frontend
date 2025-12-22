'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { TextLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Map as MapGL } from 'react-map-gl/mapbox';
import styles from './JejuOceanMap.module.scss';

const MAPBOX_ACCESS_TOKEN =
  'pk.eyJ1IjoieW9uZ3dvb24iLCJhIjoiY21qNm93cXJlMGdyejNmcTJzMGVrZHNyZCJ9.MWEH1d2ExoNoykCYtndGGw';

// 시드 기반 랜덤 함수 (매번 같은 결과 생성)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// API 응답 타입 정의
interface ApiBeachData {
  name: string;
  date: string;
  location: {
    latitude: number;
    longitude: number;
  };
  prediction: {
    trash_amount: number;
  };
  status: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface DataPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  value: number;
  level: 'low' | 'medium' | 'high';
  status: string;
  lastCollected: string;
  temperature: string;
  weather: string;
  swimStatus: 'safe' | 'caution' | 'prohibited';
}

// API 데이터를 DataPoint로 변환하는 함수
function convertApiDataToDataPoint(apiData: ApiBeachData, index: number): DataPoint {
  const level = apiData.status.toLowerCase() as 'low' | 'medium' | 'high';
  
  // status 텍스트 매핑
  const statusText = 
    level === 'high' ? '청정 - 방문 안전' :
    level === 'medium' ? '주의 - 모니터링' :
    '위험';
  
  // swimStatus는 쓰레기량에 따라 결정 (임시 로직)
  const swimStatus: 'safe' | 'caution' | 'prohibited' = 
    apiData.prediction.trash_amount > 100 ? 'prohibited' :
    apiData.prediction.trash_amount > 70 ? 'caution' : 'safe';
  
  return {
    id: String(index + 1),
    name: apiData.name,
    lat: apiData.location.latitude,
    lng: apiData.location.longitude,
    value: apiData.prediction.trash_amount,
    level,
    status: statusText,
    lastCollected: apiData.date,
    temperature: '18°C', // API에서 제공하지 않는 정보는 기본값
    weather: '맑음',
    swimStatus,
  };
}

export default function JejuOceanMap({ filter = 'all' }: { filter?: 'all' | 'low' | 'medium' | 'high' }) {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [oceanData, setOceanData] = useState<DataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [currentBearing, setCurrentBearing] = useState(-17.6);
  const [currentPitch, setCurrentPitch] = useState(60);

  // 클라이언트 사이드에서만 렌더링되도록 보장 - 최우선 체크
  useEffect(() => {
    // 약간의 지연을 두고 마운트하여 WebGL 컨텍스트가 완전히 준비되도록 함
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // API에서 데이터 가져오기
  useEffect(() => {
    if (!isMounted) return; // 마운트되지 않았으면 데이터 로딩 스킵
    
    const fetchBeachData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8000';
        
        // 한국 시간 기준으로 날짜 계산 (오전 6시 이전이면 전날 날짜)
        const now = new Date();
        const kstDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
        const hour = kstDate.getHours();
        
        // 오전 6시 이전이면 하루 빼기
        if (hour < 6) {
          kstDate.setDate(kstDate.getDate() - 1);
        }
        
        const predictionDate = kstDate.toLocaleDateString('sv-SE'); // YYYY-MM-DD 형식
        const url = `${apiHost}/api/v1/trash/beach?prediction_date=${predictionDate}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error(`API 요청 실패: ${response.status}`);
        }
        
        const data: ApiBeachData[] = await response.json();
        const convertedData = data.map((item, index) => convertApiDataToDataPoint(item, index));
        
        setOceanData(convertedData);
      } catch (err) {
        console.error('해양 데이터 로딩 실패:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBeachData();
  }, [isMounted]);

  const INITIAL_VIEW_STATE = {
    longitude: 126.5312,
    latitude: 33.38,
    zoom: 9.8,
    pitch: 60,
    bearing: -17.6,
    minZoom: 8.5,
    maxZoom: 12,
  };

  // 전체 데이터의 최대값 계산 (필터링 시에도 높이 기준 유지)
  const maxValue = useMemo(() => {
    if (oceanData.length === 0) return 100;
    return Math.max(...oceanData.map(point => point.value));
  }, [oceanData]);

  // 각 데이터 포인트 주변에 여러 포인트를 생성하여 hexagon 시각화 개선 (메모이제이션)
  const hexagonData = useMemo(() => {
    if (!isMounted) return [];
    
    const filteredData = oceanData.filter(point => {
      if (filter === 'all') return true;
      return point.level === filter;
    });

    const data: any[] = [];

    filteredData.forEach(point => {
      // 각 포인트 주변에 여러 데이터 포인트 생성
      const numPoints = Math.floor(point.value / 5); // value에 비례하여 포인트 생성

      for (let i = 0; i < numPoints; i++) {
        // 시드 기반 랜덤으로 고정된 위치 생성
        const seed = parseInt(point.id) * 1000 + i;
        const angle = seededRandom(seed) * Math.PI * 2;
        const distance = seededRandom(seed + 1) * 0.02; // 약 2km 반경
        const lng = point.lng + distance * Math.cos(angle);
        const lat = point.lat + distance * Math.sin(angle);

        data.push({
          position: [lng, lat],
          value: point.value,
          level: point.level,
          name: point.name,
          id: point.id,
          status: point.status,
          lastCollected: point.lastCollected,
          temperature: point.temperature,
          weather: point.weather,
          swimStatus: point.swimStatus,
        });
      }

      // 중심 포인트도 추가
      data.push({
        position: [point.lng, point.lat],
        value: point.value,
        level: point.level,
        name: point.name,
        id: point.id,
        status: point.status,
        lastCollected: point.lastCollected,
        temperature: point.temperature,
        weather: point.weather,
        swimStatus: point.swimStatus,
      });
    });

    return data;
  }, [filter, isMounted, oceanData]);

  // 해안 이름 라벨 데이터 계산 (메모이제이션)
  const labelData = useMemo(() => {
    if (!isMounted) return [];
    
    const filteredData = oceanData.filter(point => {
      if (filter === 'all') return true;
      return point.level === filter;
    });

    // 현재 카메라 방향으로 오프셋 계산 (막대 앞쪽에 배치)
    const bearingRad = currentBearing * (Math.PI / 180);
    // pitch에 따라 offset 조정 (pitch가 높을수록 offset 증가)
    const pitchFactor = currentPitch / 60; // 기준 pitch 60도
    const offset = -0.035 * pitchFactor; // pitch에 비례하여 조정

    return filteredData.map(point => ({
      position: [
        point.lng + offset * Math.sin(bearingRad),
        point.lat + offset * Math.cos(bearingRad), 
        point.value * 25 + 1000 // z 좌표를 더 낮춰서 그래프에 가깝게
      ],
      text: point.name,
      value: point.value,
      name: point.name,
    }));
  }, [filter, currentBearing, currentPitch, isMounted, oceanData]);

  // 클릭 핸들러
  const handleClick = useCallback((info: any): boolean => {
    if (info.object) {
      let pointName = null;

      // HexagonLayer인 경우
      if (info.object.points && info.object.points[0]) {
        pointName = info.object.points[0].name;
      }
      // TextLayer인 경우
      else if (info.object.name) {
        pointName = info.object.name;
      }

      if (pointName) {
        const point = oceanData.find(p => p.name === pointName);
        if (point) {
          setHoveredPoint(point);
          setMousePos({ x: info.x, y: info.y });
          return true;
        }
      }
    }
    return false;
  }, [oceanData]);

  const layers = useMemo(
    () => {
      if (!isMounted) return [];
      
      return [
      new HexagonLayer({
        id: 'hexagon-layer',
        data: hexagonData,
        pickable: true,
        extruded: true,
        radius: 1000, // 1km hexagon radius
        elevationScale: 20,
        elevationRange: [0, maxValue], // 전체 데이터 최대값을 기준으로 고정
        upperPercentile: 100, // 상위 100% 데이터 모두 표시
        getPosition: (d: any) => d.position,
        getElevationWeight: (d: any) => d.value,
        getColorWeight: (d: any) => d.value,
        colorRange: [
          [26, 152, 80, 200], // 녹색 (낮음)
          [102, 194, 165, 200],
          [171, 221, 164, 200],
          [254, 224, 139, 200], // 노란색 (중간)
          [253, 174, 97, 200],
          [244, 109, 67, 200], // 주황색
          [215, 48, 39, 200], // 빨간색 (높음)
        ],
        coverage: 0.9,
        onClick: handleClick,
      }),
      new TextLayer({
        id: 'ratio-labels',
        data: labelData,
        pickable: true,

        // Position & Text
        getPosition: (d: any) => d.position,
        getText: (d: any) => d.text,

        // Size Configuration - pixels로 변경하여 크기 문제 해결
        getSize: 10,
        sizeScale: 1,
        sizeUnits: 'pixels',
        sizeMinPixels: 14,
        sizeMaxPixels: 20,

        // Color & Styling - 더 밝고 클릭 가능해 보이도록
        getColor: [255, 255, 255, 255],
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',

        // 3D Billboard Mode
        billboard: true, // billboard 켜서 카메라를 향하게

        // Background for readability - 파란색 배경으로 클릭 가능해 보이도록
        background: true,
        getBackgroundColor: [37, 99, 235, 200], // 파란색 배경
        backgroundPadding: [8, 4, 8, 4],

        // Outline - 더 밝게
        outlineWidth: 2,
        outlineColor: [255, 255, 255, 120],

        // Font settings
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold',
        
        // 한글 문자셋 명시
        characterSet: 'auto',
        
        // Interaction
        onClick: handleClick,
      }),
    ];
    },
    [hexagonData, labelData, handleClick, isMounted]
  );

  // 클라이언트 사이드가 아니면 로딩 화면 반환
  if (!isMounted) {
    return (
      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto"></div>
          <p className="text-lg text-gray-300">초기화 중...</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto"></div>
          <p className="text-lg text-gray-300">해양 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="absolute inset-0 flex h-full w-full items-center justify-center bg-gray-900">
        <div className="max-w-md rounded-lg bg-red-900/50 p-6 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mb-2 text-xl font-bold text-white">데이터 로딩 실패</h3>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-red-600 px-6 py-2 text-white hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.mapContainer}>
      {/* DeckGL + Mapbox 지도 */}
      {isMounted && (
        <DeckGL
          initialViewState={INITIAL_VIEW_STATE}
          controller={{
            touchRotate: true,
            touchZoom: true,
            dragRotate: true,
            dragPan: true,
            scrollZoom: true,
            minZoom: 8.5,
            maxZoom: 12,
          }}
          layers={layers}
          onViewStateChange={({ viewState }: any) => {
            // 제주도 경계 내로 제한
            const constrainedViewState = {
              ...viewState,
              zoom: Math.max(8.5, Math.min(12, viewState.zoom)),
              longitude: Math.max(125.7, Math.min(127.3, viewState.longitude)),
              latitude: Math.max(32.8, Math.min(33.9, viewState.latitude)),
            };
            setCurrentBearing(constrainedViewState.bearing || 0);
            setCurrentPitch(constrainedViewState.pitch || 60);
            return constrainedViewState;
          }}
          onWebGLInitialized={(gl: any) => {
            // WebGL 컨텍스트가 초기화되었을 때 실행
            console.log('WebGL initialized');
          }}
        >
          <MapGL
            mapboxAccessToken={MAPBOX_ACCESS_TOKEN}
            mapStyle="mapbox://styles/mapbox/outdoors-v12"
            maxBounds={[
              [125.7, 32.8], // 남서쪽 경계 (좌하단)
              [127.3, 33.9], // 북동쪽 경계 (우상단)
            ]}
          />
        </DeckGL>
      )}

      {/* 호버 팝업 - 모달 스타일 */}
      {hoveredPoint && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className={styles.modalOverlay}
            onClick={() => setHoveredPoint(null)}
          ></div>
          
          {/* 모달 컨텐츠 */}
          <div className={styles.modalContainer}>
            <div className={styles.modal}>
              {/* 헤더 */}
              <div className={styles.modalHeader}>
                <h2>{hoveredPoint.name}</h2>
                <button 
                  className={styles.closeButton}
                  onClick={() => setHoveredPoint(null)}
                  aria-label="닫기"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* 상태 버튼 */}
              <div className={styles.statusButtonContainer}>
                <button className={`${styles.statusButton} ${styles[hoveredPoint.level]}`}>
                  {hoveredPoint.level === 'low' ? '청정' : hoveredPoint.level === 'medium' ? '주의' : '위험'}
                  <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

              {/* 정보 리스트 */}
              <div className={styles.infoSection}>
                <div className={styles.infoRow}>
                  <span className={styles.bullet}>●</span>
                  <span className={styles.infoLabel}>현재 상태:</span>
                  <span className={styles.infoValue}>{hoveredPoint.status}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.bullet}>●</span>
                  <span className={styles.infoLabel}>예상 쓰레기량:</span>
                  <span className={styles.infoValue}>{hoveredPoint.value}개 (이번 주)</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.bullet}>●</span>
                  <span className={styles.infoLabel}>최근 수거일:</span>
                  <span className={styles.infoValue}>{hoveredPoint.lastCollected}</span>
                </div>
                <div className={styles.infoRow}>
                  <span className={styles.bullet}>●</span>
                  <span className={styles.infoLabel}>수온:</span>
                  <span className={styles.infoValue}>{hoveredPoint.temperature} / 날씨: {hoveredPoint.weather}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
