'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './Home.module.scss';

export default function WelcomePage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={styles.container}>
      {/* 배경 애니메이션 - 파도 효과 */}
      <div className={styles.background}>
        {/* 파도 레이어 1 - 가장 뒤 */}
        <svg className={`${styles.waveSvg} ${styles.wave1}`} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="#DBEAFE"
            fillOpacity="0.3"
            d="M0,160L48,154.7C96,149,192,139,288,149.3C384,160,480,192,576,197.3C672,203,768,181,864,165.3C960,149,1056,139,1152,149.3C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        {/* 파도 레이어 2 - 중간 */}
        <svg className={`${styles.waveSvg} ${styles.wave2}`} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="#BFDBFE"
            fillOpacity="0.4"
            d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        {/* 파도 레이어 3 - 가장 앞 */}
        <svg className={`${styles.waveSvg} ${styles.wave3}`} viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path
            fill="#93C5FD"
            fillOpacity="0.35"
            d="M0,256L48,240C96,224,192,192,288,186.7C384,181,480,203,576,224C672,245,768,267,864,261.3C960,256,1056,224,1152,213.3C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* 메인 컨텐츠 */}
      <div className={styles.content}>
        {/* 로고와 타이틀 */}
        <div className={`${styles.logoSection} ${mounted ? styles.mounted : ''}`}>
          {/* 로고 아이콘 */}
          <div className={styles.logoContainer}>
            <div className={styles.logoWrapper}>
              <div className={styles.logoCircle}>
                <Image
                  src="/logo.png"
                  alt="깨끗海 로고"
                  width={180}
                  height={180}
                  priority
                />
              </div>
              {/* 물방울 효과 */}
              <div className={styles.droplet1}></div>
              <div className={styles.droplet2}></div>
            </div>
          </div>

          <h1 className={styles.mainTitle}>
            <span className={styles.titleGradient}>
              깨끗海
            </span>
          </h1>
          <div className={styles.divider}></div>
          <p className={styles.subtitle}>제주 해양환경 예측 서비스</p>
          <p className={styles.description}>에 오신 것을 환영합니다</p>
        </div>

        {/* 설명 */}
        <div className={`${styles.infoSection} ${mounted ? styles.mounted : ''}`}>
          <p className={styles.infoText}>
            AI 기반 해양 쓰레기 예측 시스템으로
            <br />
            제주 바다를 더 깨끗하게 관리하세요
          </p>

          {/* 주요 기능 카드 */}
          <div className={styles.featuresGrid}>
            <div className={`${styles.featureCard} ${styles.blue}`}>
              <div className={`${styles.featureIcon} ${styles.blue}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>실시간 예측</h3>
              <p className={styles.featureDescription}>해양 쓰레기 유입량 실시간 모니터링</p>
            </div>

            <div className={`${styles.featureCard} ${styles.cyan}`}>
              <div className={`${styles.featureIcon} ${styles.cyan}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>지역별 분석</h3>
              <p className={styles.featureDescription}>9개 주요 해안 지역 집중 관리</p>
            </div>

            <div className={`${styles.featureCard} ${styles.indigo}`}>
              <div className={`${styles.featureIcon} ${styles.indigo}`}>
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className={styles.featureTitle}>행정 지원</h3>
              <p className={styles.featureDescription}>담당자용 리포트 자동 생성</p>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className={`${styles.actionsSection} ${mounted ? styles.mounted : ''}`}>
          <Link href="/main" className={styles.primaryButton}>
            <span>서비스 시작하기</span>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>

          <Link href="/login" className={styles.secondaryButton}>
            행정 담당자 로그인
          </Link>
        </div>

        {/* Footer */}
        <footer className={`${styles.footer} ${mounted ? styles.mounted : ''}`}>
          <p className={styles.copyright}>
            © 2025 깨끗海. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}
