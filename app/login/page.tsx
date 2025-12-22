'use client';

import { useEffect, useState } from 'react';

import Cookies from 'js-cookie';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import styles from './Login.module.scss';

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 이미 로그인된 상태면 dashboard로 리다이렉트
  useEffect(() => {
    const accessToken = Cookies.get('access_token');
    if (accessToken) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const apiHost = process.env.NEXT_PUBLIC_API_HOST || 'http://localhost:8000';
      const response = await fetch(`${apiHost}/api/v1/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
        }
        throw new Error('로그인에 실패했습니다. 다시 시도해주세요.');
      }

      const data = await response.json();

      // JWT를 쿠키에 저장
      const cookieOptions = {
        expires: keepLoggedIn ? 7 : undefined, // 7일 또는 세션 쿠키
        path: '/',
        secure: process.env.NODE_ENV === 'production', // HTTPS에서만 전송
        sameSite: 'strict' as const,
      };

      Cookies.set('access_token', data.access_token, cookieOptions);
      Cookies.set('token_type', data.token_type, cookieOptions);
      Cookies.set('username', data.username, cookieOptions);

      // dashboard로 이동
      router.push('/dashboard');
    } catch (err) {
      console.error('로그인 오류:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* 왼쪽 일러스트 섹션 */}
      <div className={styles.illustrationSection}>
        <div className={styles.illustrationContent}>
          {/* 구름 장식 */}
          <div className={styles.cloudTop}>
            <svg width="100" height="40" viewBox="0 0 100 40">
              <path
                d="M20 30 Q10 30 10 20 Q10 10 20 10 Q25 5 35 10 Q45 10 45 20 Q45 30 35 30 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className={styles.cloudRight}>
            <svg width="120" height="50" viewBox="0 0 120 50">
              <path
                d="M25 35 Q15 35 15 25 Q15 15 25 15 Q30 10 40 15 Q50 15 50 25 Q50 35 40 35 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>

          {/* 메인 로고 */}
          <div className={styles.logoSection}>
            <div className={styles.logoWrapper}>
              <svg width="80" height="40" viewBox="0 0 80 40">
                <path
                  d="M10 20 Q20 5 30 20 Q40 5 50 20 Q60 5 70 20"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className={styles.logoTitle}>깨끗海</h1>
            <p className={styles.logoSubtitle}>제주 해양환경 예측 서비스</p>
          </div>

          {/* 등대와 바다 일러스트 */}
          <div className={styles.illustrationWrapper}>
            {/* 등대 */}
            <div className={styles.lighthouse}>
              <svg width="80" height="140" viewBox="0 0 80 140">
                <rect x="30" y="20" width="20" height="60" fill="#9CA3AF" rx="2" />
                <rect x="28" y="75" width="24" height="8" fill="#6B7280" />
                <rect x="32" y="10" width="16" height="15" fill="#4B5563" rx="8" />
                <circle cx="40" cy="15" r="4" fill="#FCD34D" />
                <path d="M38 80 L42 80 L40 130 Z" fill="#9CA3AF" />
              </svg>
            </div>

            {/* 바다 파도 */}
            <svg width="400" height="200" viewBox="0 0 400 200" className={styles.oceanSvg}>
              {/* 수평선 */}
              <line x1="0" y1="100" x2="400" y2="100" stroke="#D1D5DB" strokeWidth="2" />

              {/* 파도들 */}
              <path
                d="M0 120 Q50 110 100 120 Q150 130 200 120 Q250 110 300 120 Q350 130 400 120"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
              />
              <path
                d="M0 140 Q60 130 120 140 Q180 150 240 140 Q300 130 360 140 L400 140"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="2"
              />
              <path
                d="M0 155 Q40 145 80 155 Q120 165 160 155 Q200 145 240 155 Q280 165 320 155 Q360 145 400 155"
                fill="none"
                stroke="#9CA3AF"
                strokeWidth="1.5"
              />

              {/* 모래 해변 */}
              <ellipse cx="200" cy="170" rx="150" ry="10" fill="#E5E7EB" opacity="0.5" />
              <ellipse cx="180" cy="172" rx="80" ry="6" fill="#E5E7EB" opacity="0.4" />
              <ellipse cx="240" cy="174" rx="100" ry="7" fill="#E5E7EB" opacity="0.3" />

              {/* 모래 질감 (점들) */}
              {[...Array(30)].map((_, i) => (
                <circle
                  key={i}
                  cx={100 + Math.random() * 200}
                  cy={165 + Math.random() * 15}
                  r="1"
                  fill="#D1D5DB"
                  opacity="0.3"
                />
              ))}
            </svg>
          </div>

          {/* 하단 텍스트 */}
          <div className={styles.bottomText}>
            <p>행정 담당자 전용 시스템</p>
          </div>
        </div>
      </div>

      {/* 오른쪽 로그인 폼 섹션 */}
      <div className={styles.formSection}>
        <div className={styles.formWrapper}>
          {/* 로그인 폼 카드 */}
          <div className={styles.formCard}>
            <h2 className={styles.formTitle}>행정 로그인</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* 에러 메시지 */}
              {error && (
                <div className={styles.errorMessage}>
                  <div className={styles.errorContent}>
                    <svg
                      className={styles.errorIcon}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={styles.errorText}>{error}</span>
                  </div>
                </div>
              )}

              {/* 아이디 입력 */}
              <div className={styles.inputGroup}>
                <label>아이디</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="아이디를 입력하세요"
                    className={styles.input}
                  />
                </div>
              </div>

              {/* 비밀번호 입력 */}
              <div className={styles.inputGroup}>
                <label>비밀번호</label>
                <div className={styles.inputWrapper}>
                  <div className={styles.inputIcon}>
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className={`${styles.input} ${styles.withRightIcon}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.toggleButton}
                  >
                    {showPassword ? (
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* 로그인 상태 유지 체크박스 */}
              <div className={styles.checkboxWrapper}>
                <input
                  type="checkbox"
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onChange={e => setKeepLoggedIn(e.target.checked)}
                />
                <label htmlFor="keepLoggedIn">
                  로그인 상태 유지
                </label>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className={`${styles.submitButton} ${isLoading ? styles.loading : ''}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-5 w-5 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    로그인 중...
                  </span>
                ) : (
                  '로그인'
                )}
              </button>

              {/* 비밀번호 찾기 / 계정 문의 */}
              <div className={styles.linksWrapper}>
                <a href="#">
                  비밀번호 찾기
                </a>
                <span className={styles.separator}>|</span>
                <a href="#">
                  계정 문의
                </a>
              </div>
            </form>

            {/* 안내 문구 */}
            <div className={styles.notice}>
              <p>
                행정 담당자만 접근 가능합니다
              </p>
            </div>
          </div>

          {/* 메인으로 돌아가기 */}
          <div className={styles.backLink}>
            <Link
              href="/"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              메인으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
