'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function PasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleChangePassword = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert('비밀번호가 변경되었습니다.');

    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6">
        비밀번호 변경
      </h1>

      <form
        onSubmit={handleChangePassword}
        className="space-y-4"
      >
        <input
          type="password"
          placeholder="새 비밀번호"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          placeholder="새 비밀번호 확인"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          className="w-full bg-cyan-500 text-white p-2 rounded"
        >
          비밀번호 변경
        </button>
      </form>
    </div>
  );
}
