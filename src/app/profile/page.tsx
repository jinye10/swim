'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    };

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-white">
        마이페이지
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">

        <div>
          <p className="text-slate-400 text-sm">닉네임</p>
          <p className="text-white text-lg font-bold">
            {user?.user_metadata?.full_name || '사용자'}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">이메일</p>
          <p className="text-white text-lg">
            {user?.email}
          </p>
        </div>

        <div>
          <p className="text-slate-400 text-sm">회원 ID</p>
          <p className="text-cyan-400 text-sm break-all">
            {user?.id}
          </p>
        </div>

        <div className="flex gap-4 pt-4">

          <Link
            href="/profile/password"
            className="px-5 py-2 rounded-lg bg-cyan-500 text-white font-semibold"
          >
            비밀번호 변경
          </Link>

          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-lg bg-red-500 text-white font-semibold"
          >
            로그아웃
          </button>

        </div>
      </div>
    </div>
  );
}
