import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '네이버 블로그 자동 발행 관리자',
  description: '네이버 블로그 자동 발행용 관리자 페이지'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
