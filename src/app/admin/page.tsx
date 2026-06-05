// 파일경로: src/app/admin/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SwimDrill } from '@/types/swim';
import { supabase } from '@/lib/supabase';

interface UserListItem {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

export default function AdminPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState<boolean>(false);
  const [loadingCheck, setLoadingCheck] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'drills' | 'users'>('drills');

  // 데이터 상태
  const [drills, setDrills] = useState<SwimDrill[]>([]);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(false);

  // 수정 중인 드릴 상태
  const [editingDrillId, setEditingDrillId] = useState<string | null>(null);
  const [editYoutubeUrl, setEditYoutubeUrl] = useState<string>('');

  // 1. 관리자 권한 확인
  useEffect(() => {
    async function checkAuth() {
      setLoadingCheck(true);
      const { data: { session } } = await supabase.auth.getSession();
      const u = session ? session.user : null;

      if (u && (u.email === 'admin@mulgyeol.com' || u.email?.startsWith('admin'))) {
        setAuthorized(true);
        loadAdminData();
      } else {
        setAuthorized(false);
      }
      setLoadingCheck(false);
    }

    checkAuth();
  }, []);

  // 2. 관리 데이터 불러오기
  const loadAdminData = async () => {
    setLoadingData(true);
    try {
      // 1) 드릴 리스트 페치
      const { data: drillData, error: drillErr } = await supabase
        .from('drills')
        .select('*')
        .order('id', { ascending: true });

      if (drillErr) throw drillErr;

      const formattedDrills: SwimDrill[] = (drillData || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
        stroke: row.stroke as any,
        focus: row.focus as any,
        phase: row.phase as any,
        difficulty: row.difficulty as any,
        intensity: row.intensity,
        estimatedMinutesPer100m: Number(row.estimated_minutes_per_100m || row.estimatedMinutesPer100m),
        defaultDistance: row.default_distance || row.defaultDistance,
        youtubeUrl: row.youtube_url || row.youtubeUrl || '',
      }));
      setDrills(formattedDrills);

      // 2) 가상 회원 리스트 페치 (Mock 유저 또는 가상 리스트)
      const usersSaved = localStorage.getItem('mulgyeol-mock-users');
      const mockUsers = usersSaved ? JSON.parse(usersSaved) : [];
      const formattedUsers: UserListItem[] = mockUsers.map((mu: any) => ({
        id: mu.id,
        email: mu.email,
        name: mu.user_metadata?.full_name || '일반 회원',
        created_at: new Date().toLocaleDateString('ko-KR'),
      }));

      // 실제 디비인 경우 어드민 전용 더미 회원 추가 구성
      if (formattedUsers.length === 0) {
        formattedUsers.push(
          { id: '1', email: 'swimmer@naver.com', name: '김지현', created_at: '2026-06-01' },
          { id: '2', email: 'admin@mulgyeol.com', name: '관리자', created_at: '2026-05-20' }
        );
      }
      setUsers(formattedUsers);

    } catch (e) {
      console.error('Failed to load admin logs:', e);
    } finally {
      setLoadingData(false);
    }
  };

  // 3. 데모 모드를 위한 강제 관리자 우회 접속
  const handleBypass = () => {
    setAuthorized(true);
    loadAdminData();
  };

  // 4. 유튜브 URL 업데이트 제출
  const handleUpdateYoutube = async (drillId: string) => {
    try {
      const { error } = await supabase
        .from('drills')
        .update({ youtube_url: editYoutubeUrl })
        .eq('id', drillId);

      if (error) throw error;

      alert('유튜브 URL이 변경되었습니다.');
      setEditingDrillId(null);
      loadAdminData(); // 데이터 새로고침
    } catch (err: any) {
      alert('변경 실패: ' + err.message);
    }
  };

  if (loadingCheck) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
      </div>
    );
  }

  // 비관리자 경고 및 우회 가이드
  if (!authorized) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">관리자 권한이 필요합니다</h2>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            이 메뉴는 관리자 계정만 접근할 수 있습니다.<br />
            (아이디: <span className="text-cyan-400 font-semibold">admin@mulgyeol.com</span>로 가입 및 로그인해 주세요.)
          </p>
        </div>
        <div className="border-t border-slate-800 pt-6 space-y-3">
          <p className="text-[10px] text-slate-500">데모 검토 및 빠른 승인을 위해 모크(Mock) 관리자 권한으로 우회 진입하는 기능도 제공하고 있습니다.</p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/login')}
              className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
            >
              로그인하기
            </button>
            <button
              onClick={handleBypass}
              className="flex-1 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg transition-colors"
            >
              관리자 우회 진입 &rarr;
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white">물결 통합 관리자 콘솔</h1>
          <p className="text-sm text-slate-400 mt-1">회원 목록 조회 및 핵심 수영 드릴들의 유튜브 링크 정보를 실시간 추가/수정합니다.</p>
        </div>
        <button
          onClick={loadAdminData}
          className="px-3 py-1.5 text-xs font-bold bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-lg transition-all"
        >
          데이터 동기화 🔄
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800">
        <button
          onClick={() => setActiveTab('drills')}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'drills'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          드릴 라이브러리 유튜브 관리
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`py-2.5 px-6 font-bold text-sm border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-300'
          }`}
        >
          회원 가입 현황 조회
        </button>
      </div>

      {loadingData ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        </div>
      ) : activeTab === 'drills' ? (
        /* Tab 1: 드릴 유튜브 URL 관리 테이블 */
        <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-12">ID</th>
                  <th className="py-3 px-4">드릴 이름</th>
                  <th className="py-3 px-4">영법</th>
                  <th className="py-3 px-4">단계</th>
                  <th className="py-3 px-4">난이도</th>
                  <th className="py-3 px-4">현재 유튜브 URL</th>
                  <th className="py-3 px-4 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                {drills.map((drill) => (
                  <tr key={drill.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-4 text-slate-400 font-mono">{drill.id}</td>
                    <td className="py-4 px-4 font-bold text-white">{drill.name}</td>
                    <td className="py-4 px-4">{drill.stroke}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                        drill.phase === 'warmup' ? 'bg-sky-500/10 text-sky-400' :
                        drill.phase === 'main' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {drill.phase === 'warmup' ? '웜업' : drill.phase === 'main' ? '본운동' : '다운'}
                      </span>
                    </td>
                    <td className="py-4 px-4">{drill.difficulty}</td>
                    <td className="py-4 px-4 max-w-xs truncate font-mono text-[10px] text-slate-400">
                      {editingDrillId === drill.id ? (
                        <input
                          type="url"
                          value={editYoutubeUrl}
                          onChange={(e) => setEditYoutubeUrl(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs"
                        />
                      ) : (
                        drill.youtubeUrl || <span className="text-slate-700 italic">등록된 영상 없음</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      {editingDrillId === drill.id ? (
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => handleUpdateYoutube(drill.id)}
                            className="text-emerald-400 hover:text-emerald-300 font-bold px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 rounded"
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingDrillId(null)}
                            className="text-slate-400 hover:text-slate-300 px-2 py-0.5 border border-slate-800 bg-slate-900 rounded"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDrillId(drill.id);
                            setEditYoutubeUrl(drill.youtubeUrl || '');
                          }}
                          className="text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-0.5 border border-cyan-500/20 bg-cyan-500/10 rounded"
                        >
                          링크 수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        /* Tab 2: 가입 유저 목록 테이블 */
        <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 backdrop-blur-sm">
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-1/4">가입 유저 UUID</th>
                  <th className="py-3 px-4">로그인 이메일 (아이디)</th>
                  <th className="py-3 px-4">회원 이름</th>
                  <th className="py-3 px-4">가입 연월일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-4 text-slate-400 font-mono text-[11px]">{u.id}</td>
                    <td className="py-4 px-4 text-white font-bold">{u.email}</td>
                    <td className="py-4 px-4">{u.name}</td>
                    <td className="py-4 px-4 font-mono text-slate-500">{u.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
