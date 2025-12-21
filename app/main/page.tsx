'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import Cookies from 'js-cookie';

import ChatBot from '../components/ChatBot';
import styles from './Main.module.scss';

const JejuOceanMap = dynamic(() => import('../components/JejuOceanMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
      지도 로딩 중...
    </div>
  ),
});

// 시드 기반 랜덤 함수 (항상 같은 결과 생성)
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// 파티클 데이터를 미리 생성 (SSR과 CSR에서 동일한 값)
const particles = [...Array(15)].map((_, i) => ({
  left: `${seededRandom(i * 100) * 100}%`,
  top: `${seededRandom(i * 100 + 1) * 100}%`,
  animation: `float ${3 + seededRandom(i * 100 + 2) * 4}s ease-in-out infinite`,
  animationDelay: `${seededRandom(i * 100 + 3) * 2}s`,
}));

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [filter, setFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  useEffect(() => {
    setIsMounted(true);
    // 로그인 상태 확인
    const accessToken = Cookies.get('access_token');
    setIsLoggedIn(!!accessToken);
  }, []);

  if (!isMounted) {
    return (
      <div className={styles.loadingContainer}>
        {/* 배경 애니메이션 - 물결 효과 */}
        <div className={styles.loadingBg}>
          <div className={styles.wave}></div>
          <div className={`${styles.wave} ${styles.wave2}`}></div>
        </div>

        {/* 메인 로딩 컨텐츠 */}
        <div className={styles.loadingContent}>
          {/* 로딩 아이콘 - 물결 링 */}
          <div className={styles.loadingIcon}>
            {/* 외부 링 */}
            <div className={styles.ring}></div>
            <div className={`${styles.ring} ${styles.ring2}`}></div>
            
            {/* 중앙 아이콘 */}
            <div className={styles.iconCircle}>
              <div className={styles.iconInner}>
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C9.243 2 7 4.243 7 7c0 1.824.974 3.424 2.432 4.305A5.994 5.994 0 006 17v3c0 1.103.897 2 2 2h8c1.103 0 2-.897 2-2v-3a5.994 5.994 0 00-3.432-5.695C16.026 10.424 17 8.824 17 7c0-2.757-2.243-5-5-5zm0 2c1.654 0 3 1.346 3 3s-1.346 3-3 3-3-1.346-3-3 1.346-3 3-3z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* 로딩 텍스트 */}
          <div className={styles.loadingText}>
            <h2>🌊 제주 해양환경</h2>
            <p>지도 초기화 중...</p>
          </div>

          {/* 프로그레스 바 */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
        </div>

        {/* 떠다니는 파티클 효과 */}
        <div className={styles.particles}>
          {particles.map((particle, i) => (
            <div
              key={i}
              className={styles.particle}
              style={particle}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 모던한 헤더 */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          {/* 좌측: 로고 + 타이틀 */}
          <div className={styles.logoSection}>
            <Image
              src="/logo.png"
              alt="깨끗해양 로고"
              width={40}
              height={40}
              className={styles.logoImage}
            />
            <h1 className={styles.logoText}>깨끗해양</h1>
          </div>

          {/* 중앙: 서비스명 */}
          <div className={styles.centerTitle}>
            <h2>제주 해양환경 예측 서비스</h2>
          </div>

          {/* 우측: 행정 로그인 버튼 */}
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className={styles.loginButton}
          >
            <div className={styles.buttonContent}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{isLoggedIn ? '대시보드' : '행정 로그인'}</span>
            </div>
          </Link>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {/* 지도 카드 */}
          <div className={styles.mapCard}>
            {/* 지도 영역 - 범례를 내부에 배치 */}
            <div className={styles.mapContainer}>
              <JejuOceanMap filter={filter} />

              {/* 필터 버튼 */}
              <div className={styles.filterContainer}>
                <button
                  onClick={() => setFilter('all')}
                  className={`${styles.filterButton} ${styles.all} ${filter === 'all' ? styles.active : ''}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" />
                  </svg>
                  <span className={styles.filterText}>전체</span>
                </button>

                <button
                  onClick={() => setFilter('low')}
                  className={`${styles.filterButton} ${styles.low} ${filter === 'low' ? styles.active : ''}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className={styles.filterText}>청정</span>
                </button>

                <button
                  onClick={() => setFilter('medium')}
                  className={`${styles.filterButton} ${styles.medium} ${filter === 'medium' ? styles.active : ''}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 10a1 1 0 011-1h5V4a1 1 0 112 0v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className={styles.filterText}>주의</span>
                </button>

                <button
                  onClick={() => setFilter('high')}
                  className={`${styles.filterButton} ${styles.high} ${filter === 'high' ? styles.active : ''}`}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className={styles.filterText}>위험</span>
                </button>
              </div>

              {/* 우측 하단 범례 */}
              <div className={styles.legend}>
                <h3>해변 상태 범례</h3>

                <div className={styles.legendItems}>
                  {/* 청정 (Clean) */}
                  <div className={`${styles.legendItem} ${styles.clean}`}>
                    <div className={styles.badge}>
                      <span>92%</span>
                    </div>
                    <div className={styles.itemText}>
                      <h4>청정 (Clean)</h4>
                      <p>쓰레기량 낮음</p>
                    </div>
                  </div>

                  {/* 주의 (Caution) */}
                  <div className={`${styles.legendItem} ${styles.caution}`}>
                    <div className={styles.badge}>
                      <span className={styles.darkText}>65%</span>
                    </div>
                    <div className={styles.itemText}>
                      <h4>주의 (Caution)</h4>
                      <p>쓰레기량 보통</p>
                    </div>
                  </div>

                  {/* 위험 (Danger) */}
                  <div className={`${styles.legendItem} ${styles.danger}`}>
                    <div className={styles.badge}>
                      <span>30%</span>
                    </div>
                    <div className={styles.itemText}>
                      <h4>위험 (Danger)</h4>
                      <p>쓰레기량 높음</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 챗봇 */}
      <ChatBot type="user" />
    </div>
  );
}
