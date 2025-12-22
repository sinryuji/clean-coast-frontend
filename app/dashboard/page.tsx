'use client';

import { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowDownTrayIcon,
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';

import ChatBot from '../components/ChatBot';
import styles from './Dashboard.module.scss';

// API 응답 타입 정의
interface DashboardSummary {
  total_predicted_amount: number;
  previous_month_change: number;
  high_risk_count: number;
  medium_risk_count: number;
  immediate_action_count: number;
  regular_check_count: number;
}

interface MonthlyTrend {
  month: string;
  year: number;
  total_amount: number;
}

interface RiskArea {
  beach_name: string;
  predicted_amount: number;
  risk_level: string;
  action_required: string;
  latitude: number;
  longitude: number;
}

interface VisitorStat {
  region: string;
  year_month: string;
  visitor: number;
}

interface DashboardData {
  target_month: string;
  summary: DashboardSummary;
  monthly_trends: MonthlyTrend[];
  risk_areas: RiskArea[];
  visitor_stats: VisitorStat[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState('statistics');
  const [chatMessage, setChatMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataError, setDataError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // JWT 인증 확인
  useEffect(() => {
    const accessToken = Cookies.get('access_token');
    
    if (!accessToken) {
      // JWT가 없으면 로그인 페이지로 리다이렉트
      router.push('/login');
      return;
    }
    
    // JWT가 있으면 인증 완료
    setIsAuthenticated(true);
    setIsLoading(false);
  }, [router]);

  // Dashboard 데이터 가져오기
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchDashboardData = async () => {
      try {
        const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8000';
        const accessToken = Cookies.get('access_token');
        
        const response = await fetch(`${apiHost}/api/v1/dashboard`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // 인증 만료 시 로그인 페이지로
            Cookies.remove('access_token');
            Cookies.remove('token_type');
            Cookies.remove('username');
            router.push('/login');
            return;
          }
          throw new Error('대시보드 데이터를 불러오는데 실패했습니다.');
        }

        const data: DashboardData = await response.json();
        setDashboardData(data);
      } catch (err) {
        console.error('대시보드 데이터 로딩 실패:', err);
        setDataError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다.');
      }
    };

    fetchDashboardData();
  }, [isAuthenticated, router]);

  // 로그아웃 핸들러
  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('token_type');
    Cookies.remove('username');
    router.push('/login');
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Chat message:', chatMessage);
    setChatMessage('');
  };

  // PDF 보고서 생성 함수
  const generatePdfReport = async () => {
    setPdfLoading(true);
    setPdfError(null);
    
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8000';
      const accessToken = Cookies.get('access_token');
      
      const response = await fetch(`${apiHost}/api/v1/report/monthly`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_name: '해양환경공단'
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          Cookies.remove('access_token');
          Cookies.remove('token_type');
          Cookies.remove('username');
          router.push('/login');
          return;
        }
        throw new Error('보고서 생성에 실패했습니다.');
      }

      // PDF Blob 생성
      const blob = await response.blob();
      
      // 기존 URL이 있으면 해제
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      // 새로운 URL 생성
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
    } catch (err) {
      console.error('PDF 생성 오류:', err);
      setPdfError(err instanceof Error ? err.message : 'PDF 생성에 실패했습니다.');
    } finally {
      setPdfLoading(false);
    }
  };

  // PDF 다운로드 함수
  const downloadPdfReport = async () => {
    try {
      const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8000';
      const accessToken = Cookies.get('access_token');
      
      const response = await fetch(`${apiHost}/api/v1/report/monthly`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_name: '해양환경공단'
        }),
      });

      if (!response.ok) {
        throw new Error('보고서 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `해양쓰레기_예측보고서_${dashboardData?.target_month || new Date().toISOString().slice(0, 7)}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF 다운로드 오류:', err);
      alert(err instanceof Error ? err.message : 'PDF 다운로드에 실패했습니다.');
    }
  };

  // 보고서 섹션이 활성화될 때 PDF 자동 생성
  useEffect(() => {
    if (activeMenu === 'reports' && !pdfUrl && !pdfLoading && !pdfError) {
      generatePdfReport();
    }
  }, [activeMenu]);

  // 컴포넌트 언마운트 시 URL 해제
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-700 border-t-blue-500 mx-auto"></div>
          <p className="text-lg text-gray-300">인증 확인 중...</p>
        </div>
      </div>
    );
  }

  // 데이터 로딩 중
  if (!dashboardData && !dataError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 mx-auto"></div>
          <p className="text-lg text-gray-700">대시보드 데이터 로딩 중...</p>
        </div>
      </div>
    );
  }

  // 데이터 로딩 실패
  if (dataError) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <div className="max-w-md rounded-lg bg-red-50 p-6 text-center">
          <svg className="mx-auto mb-4 h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mb-2 text-xl font-bold text-red-800">데이터 로딩 실패</h3>
          <p className="text-red-700">{dataError}</p>
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

  // monthly_trends를 차트 데이터로 변환
  const monthlyData = dashboardData?.monthly_trends?.map(trend => ({
    month: `${trend.month}`,
    value: trend.total_amount,
  })) || [];
  const maxValue = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.value), 1) : 1;

  // 디버깅: 차트 데이터 확인
  console.log('Chart Debug:', {
    monthlyDataLength: monthlyData.length,
    monthlyData: monthlyData,
    maxValue: maxValue,
  });

  return (
    <div className={styles.container}>
      {/* 왼쪽 사이드바 */}
      <aside className={styles.sidebar}>
        {/* 로고 */}
        <div className={styles.logoSection}>
          <div className={styles.logoContent}>
            <div className="flex h-10 w-10 items-center justify-center">
              <Image
                src="/logo.png"
                alt="깨끗해양 로고"
                width={40}
                height={40}
                className="rounded-full"
              />
            </div>
            <span className={styles.logoText}>깨끗海</span>
          </div>
        </div>

        {/* 메뉴 */}
        <nav className={styles.navigation}>
          <div className={styles.navSection}>
            <h3 className={styles.navTitle}>메뉴</h3>
            <div className={styles.navButtons}>
              <button
                onClick={() => setActiveMenu('statistics')}
                className={`${styles.navButton} ${
                  activeMenu === 'statistics' ? styles.active : ''
                }`}
              >
                <ChartBarIcon />
                <span>통계</span>
              </button>
              <button
                onClick={() => setActiveMenu('reports')}
                className={`${styles.navButton} ${
                  activeMenu === 'reports' ? styles.active : ''
                }`}
              >
                <DocumentTextIcon />
                <span>보고서 생성</span>
              </button>
              <button
                onClick={() => setActiveMenu('visitors')}
                className={`${styles.navButton} ${
                  activeMenu === 'visitors' ? styles.active : ''
                }`}
              >
                <MapPinIcon />
                <span>방문객 통계</span>
              </button>
            </div>
          </div>
        </nav>

        {/* 로그아웃 */}
        <div className={styles.logoutSection}>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className={styles.mainContent}>
        {/* 헤더 */}
        <header className={styles.header}>
          <h1 className={styles.headerTitle}>행정 대시보드</h1>
          <div className="flex items-center gap-4">
            <div className={styles.headerUser}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <span>{Cookies.get('username') || '관리자'}</span>
            </div>
            <Link
              href="/main"
              className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              메인으로
            </Link>
          </div>
        </header>

        <div className={styles.contentArea}>
          {activeMenu === 'statistics' && (
            <>
              {/* 타이틀 */}
              <div className={styles.sectionTitle}>
                <h2>
                  월간 예측 대시보드 - {dashboardData?.target_month}
                </h2>
              </div>

              {/* 통계 카드 */}
              <div className={styles.statsGrid}>
                {/* 총 예상 유입량 */}
                <div className={styles.statsCardSmall}>
                  <h3>총 예상 유입량</h3>
                  <div className={styles.statsValue}>
                    <span className={styles.blue}>{dashboardData?.summary.total_predicted_amount.toLocaleString()}개</span>
                  </div>
                  <div className={styles.statsDetails}>
                    <span className={styles.label}>전월 대비</span>
                    <span className={`${styles.value} ${(dashboardData?.summary.previous_month_change ?? 0) >= 0 ? styles.positive : styles.negative}`}>
                      {(dashboardData?.summary.previous_month_change ?? 0) > 0 ? '+' : ''}{dashboardData?.summary.previous_month_change ?? 0}%
                      <ArrowTrendingUpIcon />
                    </span>
                  </div>
                </div>

                {/* 위험 지역 */}
                <div className={styles.statsCardSmall}>
                  <h3>위험 지역</h3>
                  <div className={styles.statsValue}>
                    <span className={styles.red}>{dashboardData?.summary.high_risk_count}개소</span>
                  </div>
                  <div className={styles.statsDetails}>
                    <span className={styles.subvalue}>
                      추적 지역: <span>{dashboardData?.summary.medium_risk_count}개소</span>
                    </span>
                  </div>
                </div>

                {/* 수거 계획 필요 */}
                <div className={styles.statsCardSmall}>
                  <h3>수거 계획 필요</h3>
                  <div className={styles.statsValue}>
                    <span className={styles.orange}>즉시 조치 {dashboardData?.summary.immediate_action_count}곳</span>
                  </div>
                  <div className={styles.statsDetails}>
                    <span className={styles.subvalue}>
                      장기 점검 <span>{dashboardData?.summary.regular_check_count}곳</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 월별 쓰레기 유입량 추이 차트 */}
              <div className={styles.chartCard}>
                <h3>
                  월별 쓰레기 유입량 추이 ({monthlyData.length}개월)
                </h3>
                {monthlyData.length === 0 ? (
                  <div className={styles.noData}>
                    차트 데이터가 없습니다
                  </div>
                ) : (
                  <div className={styles.chartContainer}>
                    {/* Y축 라벨 */}
                    <div className={styles.chartYAxis}>
                      <span>{maxValue.toFixed(0)}</span>
                      <span>{(maxValue * 0.75).toFixed(0)}</span>
                      <span>{(maxValue * 0.5).toFixed(0)}</span>
                      <span>{(maxValue * 0.25).toFixed(0)}</span>
                      <span>0</span>
                    </div>

                    {/* 차트 영역 */}
                    <div className={styles.chartArea}>
                      {monthlyData.map((data, index) => {
                        const heightPercent = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                        const barHeightPx = maxValue > 0 ? Math.max((data.value / maxValue) * 200, data.value > 0 ? 4 : 0) : 0;
                        
                        return (
                          <div
                            key={index}
                            className={styles.chartBar}
                          >
                            <div
                              className={styles.chartBarInner}
                            >
                              <div className={styles.barWrapper}>
                                <div
                                  className={styles.bar}
                                  style={{ 
                                    height: `${barHeightPx}px`
                                  }}
                                >
                                  <div className={styles.barTooltip}>
                                    {data.value.toLocaleString()}개
                                  </div>
                                </div>
                              </div>
                            </div>
                            <span className={styles.chartLabel}>{data.month}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 위험 지역 요약 테이블 */}
              <div className={styles.tableCard}>
                <h3>위험 지역 요약</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>
                          지역명
                        </th>
                        <th>
                          예상량
                        </th>
                        <th>
                          위험도
                        </th>
                        <th>
                          조치사항
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.risk_areas.map((area, index) => {
                        return (
                          <tr key={index}>
                            <td className={styles.textGray800}>{area.beach_name}</td>
                            <td className={styles.fontMedium}>
                              {area.predicted_amount.toLocaleString()}개
                            </td>
                            <td>
                              <span
                                className={`${styles.badge} ${
                                  area.risk_level === '높음' ? styles.red :
                                  area.risk_level === '중간' ? styles.yellow :
                                  styles.blue
                                }`}
                              >
                                {area.risk_level}
                              </span>
                            </td>
                            <td className={styles.textGray700}>{area.action_required}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* 보고서 생성 섹션 */}
          {activeMenu === 'reports' && (
            <>
              <div className={styles.reportHeader}>
                <h2 className={styles.reportTitle}>
                  {dashboardData?.target_month || new Date().toISOString().slice(0, 7)} 해양쓰레기 예측 보고서
                </h2>
                <div className={styles.reportActions}>
                  <button 
                    className={`${styles.reportButton} ${styles.edit}`}
                    onClick={generatePdfReport}
                    disabled={pdfLoading}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {pdfLoading ? '생성 중...' : '새로고침'}
                  </button>
                  <button 
                    className={`${styles.reportButton} ${styles.download}`}
                    onClick={downloadPdfReport}
                    disabled={pdfLoading || !pdfUrl}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    다운로드 (PDF)
                  </button>
                  <button 
                    className={`${styles.reportButton} ${styles.print}`}
                    onClick={() => {
                      const iframe = document.querySelector('iframe');
                      if (iframe?.contentWindow) {
                        iframe.contentWindow.print();
                      }
                    }}
                    disabled={pdfLoading || !pdfUrl}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    인쇄
                  </button>
                </div>
                <div className={styles.reportDate}>
                  생성일: {new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace(/\.$/, '')}
                </div>
              </div>

              <div className={styles.pdfViewerContainer}>
                {pdfLoading && (
                  <div className={styles.pdfPlaceholder}>
                    <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500 mx-auto"></div>
                    <p className={styles.pdfPlaceholderText}>
                      PDF 보고서를 생성하는 중...
                    </p>
                    <p className={styles.pdfPlaceholderSubtext}>
                      잠시만 기다려주세요.
                    </p>
                  </div>
                )}
                {pdfError && (
                  <div className={styles.pdfPlaceholder}>
                    <svg className={styles.pdfIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: '#ef4444' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className={styles.pdfPlaceholderText} style={{ color: '#ef4444' }}>
                      {pdfError}
                    </p>
                    <button
                      onClick={generatePdfReport}
                      className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
                    >
                      다시 시도
                    </button>
                  </div>
                )}
                {!pdfLoading && !pdfError && pdfUrl && (
                  <iframe
                    src={pdfUrl}
                    className={styles.pdfViewer}
                    title="보고서 PDF 뷰어"
                  />
                )}
                {!pdfLoading && !pdfError && !pdfUrl && (
                  <div className={styles.pdfPlaceholder}>
                    <svg className={styles.pdfIcon} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <p className={styles.pdfPlaceholderText}>
                      보고서를 생성해주세요
                    </p>
                    <button
                      onClick={generatePdfReport}
                      className="mt-4 rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 transition-colors"
                    >
                      보고서 생성
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 방문객 통계 섹션 */}
          {activeMenu === 'visitors' && dashboardData?.visitor_stats && dashboardData.visitor_stats.length > 0 ? (
            <>
              <div className={styles.sectionTitle}>
                <h2>
                  해안별 방문객 통계
                </h2>
                <p>
                  제주도 주요 해안 지역의 방문객 데이터입니다
                </p>
              </div>

              {/* 방문객 추이 차트 */}
              <div className={styles.chartCard}>
                <h3>
                  제주 해안별 월별 방문객 추이
                </h3>
                <div className={styles.svgChartContainer}>
                  <div className={styles.svgChartInner}>
                    {(() => {
                      // 데이터 전처리: 지역별로 그룹화
                      const regionMap = new Map<string, Map<string, number>>();
                      const allMonths = new Set<string>();
                      
                      dashboardData?.visitor_stats.forEach(stat => {
                        if (!regionMap.has(stat.region)) {
                          regionMap.set(stat.region, new Map());
                        }
                        regionMap.get(stat.region)!.set(stat.year_month, stat.visitor);
                        allMonths.add(stat.year_month);
                      });
                      
                      // 월 정렬
                      const sortedMonths = Array.from(allMonths).sort();
                      
                      // 색상 팔레트
                      const colors = [
                        '#06b6d4', // cyan
                        '#ef4444', // red
                        '#22c55e', // green
                        '#a855f7', // purple
                        '#f59e0b', // amber
                        '#8b5cf6', // violet
                        '#eab308', // yellow
                        '#ec4899', // pink
                        '#14b8a6', // teal
                      ];
                      
                      // 지역 데이터 생성
                      const regions = Array.from(regionMap.entries()).map(([name, monthData], idx) => ({
                        name,
                        data: sortedMonths.map(month => monthData.get(month) || 0),
                        color: colors[idx % colors.length],
                      }));
                      
                      // Y축 최대값 계산
                      const maxValue = Math.max(...regions.flatMap(r => r.data.filter(v => v > 0)));
                      const yAxisMax = Math.ceil(maxValue / 100000) * 100000;
                      
                      // X축 간격 계산
                      const xStart = 80;
                      const xStep = Math.min(50, (1100 - xStart) / (sortedMonths.length - 1));
                      
                      return (
                        <svg width="1200" height="400" className="mx-auto">
                          <defs>
                            <linearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#e5e7eb" stopOpacity="0.5" />
                              <stop offset="100%" stopColor="#e5e7eb" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* 그리드 라인 */}
                          {[0, 1, 2, 3, 4, 5, 6].map(i => {
                            const y = 50 + i * 50;
                            const value = yAxisMax - (i * yAxisMax / 6);
                            return (
                              <g key={i}>
                                <line
                                  x1="60"
                                  y1={y}
                                  x2="1180"
                                  y2={y}
                                  stroke="#e5e7eb"
                                  strokeWidth="1"
                                />
                                <text x="45" y={y + 5} fontSize="11" fill="#6b7280" textAnchor="end">
                                  {(value / 10000).toFixed(0)}만
                                </text>
                              </g>
                            );
                          })}

                          {/* X축 월별 라벨 */}
                          {sortedMonths.map((month, idx) => {
                            const x = xStart + idx * xStep;
                            // 월 포맷팅 (YYYY-MM -> MM 또는 YYYY.MM)
                            const displayMonth = month.includes('-') ? month.split('-')[1] : month;
                            return (
                              <text
                                key={idx}
                                x={x}
                                y="370"
                                fontSize="10"
                                fill="#6b7280"
                                textAnchor="middle"
                              >
                                {displayMonth}
                              </text>
                            );
                          })}

                          {/* 데이터 라인 */}
                          {regions.map((region, regionIdx) => {
                            const points = region.data
                              .map((value, idx) => {
                                const x = xStart + idx * xStep;
                                const y = value > 0 ? 350 - ((value / yAxisMax) * 300) : null;
                                return y !== null ? `${x},${y}` : null;
                              })
                              .filter(p => p !== null)
                              .join(' ');

                            return (
                              <g key={regionIdx}>
                                <polyline
                                  points={points}
                                  fill="none"
                                  stroke={region.color}
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                {region.data.map((value, idx) => {
                                  if (value === 0) return null;
                                  const x = xStart + idx * xStep;
                                  const y = 350 - ((value / yAxisMax) * 300);
                                  return (
                                    <circle
                                      key={idx}
                                      cx={x}
                                      cy={y}
                                      r="3"
                                      fill={region.color}
                                      className="hover:r-5 cursor-pointer transition-all"
                                    >
                                      <title>{`${region.name} ${sortedMonths[idx]}: ${value.toLocaleString()}명`}</title>
                                    </circle>
                                  );
                                })}
                              </g>
                            );
                          })}

                          {/* X축 */}
                          <line x1="60" y1="350" x2="1180" y2="350" stroke="#9ca3af" strokeWidth="2" />
                          <text
                            x="620"
                            y="395"
                            fontSize="12"
                            fill="#374151"
                            fontWeight="600"
                            textAnchor="middle"
                          >
                            월별
                          </text>
                        </svg>
                      );
                    })()}

                    {/* 범례 */}
                    <div className={styles.legend}>
                      {(() => {
                        const regionNames = [...new Set(dashboardData?.visitor_stats.map(s => s.region) ?? [])];
                        const colors = [
                          '#06b6d4', '#ef4444', '#22c55e', '#a855f7', 
                          '#f59e0b', '#8b5cf6', '#eab308', '#ec4899', '#14b8a6'
                        ];
                        return regionNames.map((name, idx) => (
                          <div key={name} className={styles.legendItem}>
                            <div
                              className={styles.legendColor}
                              style={{ backgroundColor: colors[idx % colors.length] }}
                            ></div>
                            <span className={styles.legendLabel}>{name}</span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 방문객 통계 테이블 */}
              <div className={styles.tableCard}>
                <h3>지역별 방문객 데이터</h3>
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>
                          지역
                        </th>
                        <th>
                          연월
                        </th>
                        <th className={styles.alignRight}>
                          방문객 수
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData?.visitor_stats.map((stat, index) => (
                        <tr key={index}>
                          <td className={styles.fontMedium}>{stat.region}</td>
                          <td className={styles.textGray600}>{stat.year_month}</td>
                          <td className={styles.alignRight}>
                            {stat.visitor.toLocaleString()}명
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : activeMenu === 'visitors' ? (
            <div className={styles.emptyState}>
              <p>방문객 통계 데이터가 없습니다.</p>
            </div>
          ) : null}
        </div>
      </main>

      {/* 챗봇 */}
      <ChatBot type="admin" />
    </div>
  );
}