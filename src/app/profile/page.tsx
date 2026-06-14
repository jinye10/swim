'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProfilePage() {
const [user, setUser] = useState<any>(null);

const [totalSessions, setTotalSessions] = useState(0);
const [totalMinutes, setTotalMinutes] = useState(0);
const [averageSatisfaction, setAverageSatisfaction] = useState(0);

useEffect(() => {
const loadProfile = async () => {
const {
data: { user },
} = await supabase.auth.getUser();

```
  setUser(user);

  if (!user) return;

  const { data: logs, error } = await supabase
    .from('feedback_logs')
    .select('*')
    .eq('user_id', user.id);

  if (!error && logs) {
    setTotalSessions(logs.length);

    const totalTime = logs.reduce(
      (sum, item) => sum + (item.actual_minutes || 0),
      0
    );

    setTotalMinutes(totalTime);

    const avg =
      logs.length > 0
        ? logs.reduce(
            (sum, item) => sum + (item.satisfaction || 0),
            0
          ) / logs.length
        : 0;

    setAverageSatisfaction(Number(avg.toFixed(1)));
  }
};

loadProfile();
```

}, []);

const handleLogout = async () => {
await supabase.auth.signOut();
window.location.href = '/';
};

return ( <div className="max-w-4xl mx-auto py-12 px-6"> <h1 className="text-3xl font-bold mb-8 text-white">
마이페이지 </h1>

```
  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">

    <div>
      <p className="text-slate-400 text-sm">닉네임</p>
      <p className="
```
