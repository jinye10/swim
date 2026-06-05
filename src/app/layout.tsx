import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "물결 (Mulgyeol) - 수영 훈련 최적화 및 드릴 라이브러리",
  description: "개인 맞춤형 수영 세션/루틴 자동 생성 엔진과 영법별 드릴 라이브러리를 통해 수영 훈련을 최적화하세요. 만족도 피드백을 기록해 실력을 향상시키세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full dark">
      <body className="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-900">
        {/* 네비게이션 헤더 */}
        <Header />

        {/* 메인 컨텐츠 영역 */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        {/* 푸터 */}
        <footer className="bg-slate-950 border-t border-slate-900 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} 물결 (Mulgyeol). All rights reserved. 수영 영법 분석 및 훈련 루틴 최적화 엔진.
          </div>
        </footer>
      </body>
    </html>
  );
}

