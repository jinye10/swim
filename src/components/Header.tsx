// 파일경로: src/components/Header.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 세션 및 인증 상태 변경 구독
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, session: any) => {
      const currentUser = session ? session.user : null;
      setUser(currentUser);
      
      if (currentUser) {
        // 이메일이 admin@mulgyeol.com 이거나 mock 모드 사용자 중 관리자 계정 판정
        setIsAdmin(currentUser.email === 'admin@mulgyeol.com' || currentUser.email?.startsWith('admin'));
      } else {
        setIsAdmin(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert('로그아웃 되었습니다.');
    setUser(null);
    setIsAdmin(false);
    router.push('/');
    // 강제 페이지 새로고침
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-6 sm:gap-8 w-full md:w-auto justify-between md:justify-start">
            {/* 로고 */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-all duration-300">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-5 h-5 text-slate-950"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437-.463 3.51.1c1.073.563 1.687 1.684 1.687 2.892 0 1.956-1.586 3.542-3.542 3.542-.705 0-1.378-.207-1.956-.563a3.542 3.542 0 01-3.542-3.542c0-1.208.614-2.329 1.687-2.892z"
                  />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500 bg-clip-text text-transparent group-hover:opacity-90 transition-opacity">
                물결 (Mulgyeol)
              </span>
            </Link>

            {/* 네비게이션 링크 */}
            <nav className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <Link
                href="/"
                className="font-medium text-slate-300 hover:text-cyan-400 transition-colors"
              >
                대시보드
              </Link>
              <Link
                href="/drills"
                className="font-medium text-slate-300 hover:text-cyan-400 transition-colors"
              >
                드릴 라이브러리
              </Link>
              <Link
                href="/generator"
                className="font-medium text-slate-300 hover:text-cyan-400 transition-colors"
              >
                루틴 생성기
              </Link>
              {user && (
                <Link
                  href="/board"
                  className="font-medium text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  영상 공유판
                </Link>
              )}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="font-medium text-amber-400 hover:text-amber-300 transition-colors"
                >
                  관리자
                </Link>
              )}
            </nav>
          </div>

          {/* 인증 상태 표시 */}
          <div className="flex items-center gap-2 sm:gap-4 mt-2 md:mt-0 ml-auto md:ml-0 text-xs sm:text-sm">
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3">
                <span className="text-slate-400 hidden sm:inline">
                  <span className="text-white font-bold">{user.user_metadata?.full_name || '회원'}</span>님
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3 py-1.5 font-semibold text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-700 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  className="px-3 py-1.5 font-semibold text-cyan-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg hover:from-cyan-300 hover:to-blue-400 transition-all shadow-md shadow-cyan-500/5 hover:shadow-cyan-500/10 active:scale-95"
                >
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
