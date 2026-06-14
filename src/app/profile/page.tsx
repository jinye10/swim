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

```
  setUser(user);
};

getUser();
```

}, []);

const handleLogout = async () => {
await supabase.auth.signOut();
window.location.href = '/';
};

return ( <div className="max-w-4xl mx-auto py-12 px-6"> <h1 className="text-3xl font-bold mb-8 text-white">
마이페이지 </h1>

```
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">

    <div className="grid md:grid-cols-2 gap-8">

      <div>
        <p className="text-slate-400 text-sm mb-1">닉네임</p>
        <p className="text-white text-xl font-bold">
          {user?.user_metadata?.full_name || '사용자'}
        </p>
      </div>

      <div>
        <p className="text-slate-400 text-sm mb-1">이메일</p>
        <p className="text-white text-xl">
          {user?.email || '-'}
        </p>
      </div>

    </div>

    <div className="mt-8">
      <p className="text-slate-400 text-sm mb-1">회원 ID</p>
      <p className="text-cyan-400 text-sm break-all">
        {user?.id}
      </p>
    </div>

    <div className="border-t border-slate-800 mt-8 pt-8">
      <h2 className="text-xl font-bold text-cyan-400 mb-4">
        📊 나의 훈련 통계
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <p className="text-slate-400 text-sm">
            총 수영 횟수
          </p>
          <p className="text-3xl font-bold text-white mt-2">
            5회
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <p className="text-slate-400 text-sm">
            누적 운동시간
          </p>
          <p className="text-3xl font-bold text-cyan-400 mt-2">
            300분
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl p-5 text-center">
          <p className="text-slate-400 text-sm">
            평균 만족도
          </p>
          <p className="text-3xl font-bold text-yellow-400 mt-2">
            ⭐ 5.0
          </p>
        </div>

      </div>
    </div>

    <div className="flex gap-4 mt-8">

      <Link
        href="/profile/password"
        className="px-5 py-3 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-semibold transition"
      >
        비밀번호 변경
      </Link>

      <button
        onClick={handleLogout}
        className="px-5 py-3 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition"
      >
        로그아웃
      </button>

    </div>

  </div>
</div>
```

);
}
