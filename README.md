# 제주 해양환경 예측 서비스 깨끗海

제주도 주변 해양환경을 머신러닝을 통해 예측하여 시각화하는 웹 애플리케이션입니다.

<img width="1280" height="682" alt="image" src="https://github.com/user-attachments/assets/6861280a-3cea-4083-9f25-ff3b2555d5f1" />


## 주요 기능

- 🗺️ Mapbox 기반 인터랙티브 지도
- 📊 해양환경 데이터 시각화 (막대 그래프)
- 🎯 데이터 필터링 (전체/낮음/보통/높음)
- 📱 반응형 디자인

## Getting Started

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.local` 파일을 생성하고 Mapbox 토큰을 설정하세요:

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

Mapbox 토큰은 [https://account.mapbox.com/](https://account.mapbox.com/)에서 무료로 발급받을 수 있습니다.

### 3. 개발 서버 실행

```bash
npm run dev
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
