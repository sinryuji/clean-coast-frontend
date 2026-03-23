import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '제주 해양환경 예측 서비스',
  description: '제주도 해안 지역의 해양 쓰레기 발생량을 예측하고 모니터링하는 서비스입니다',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
