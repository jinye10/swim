// 파일경로: src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { StrokeType, FocusType, FeedbackLog } from '@/types/swim';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();

  // 사용자 상태
  const [user, setUser] = useState<any>(null);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(true);

  // 루틴 생성 폼 상태
  const [totalMinutes, setTotalMinutes] = useState<number>(60);
  const [preferredStroke, setPreferredStroke] = useState<StrokeType | ''>('');
  const [preferredFocus, setPreferredFocus] = useState<FocusType | ''>('');
  const [difficulty, setDifficulty] = useState<'초급' | '중급' | '상급' | ''>('');

  // 만족도 로그 목록 상태
  const [logs, setLogs] = useState<FeedbackLog[]>([]);
  
  // 직접 기록 폼 상태
  const [feedbackSatisfaction, setFeedbackSatisfaction] = useState<number>(5);
  const [feedbackDifficulty, setFeedbackDifficulty] = useState<'너무 쉬움' | '적당함' | '너무 힘들었음'>('적당함');
  const [feedbackMinutes, setFeedbackMinutes] = useState<number>(60);
  const [feedbackSummary, setFeedbackSummary] = useState<string>('자유형 및 평영 인터벌 훈련');
  const [feedbackMemo, setFeedbackMemo] = useState<string>('');

  // 1. 세션 변화 구독 및 유저 확인
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session ? session.user : null);
      fetchLogs(session ? session.user : null);
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      const u = session ? session.user : null;
      setUser(u);
      fetchLogs(u);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 2. 기록 불러오기 (로그인 상태 -> Supabase, 비로그인 -> LocalStorage)
  const fetchLogs = async (currentUser: any) => {
    setLoadingLogs(true);
    if (currentUser) {
      // Supabase 테이블에서 현재 유저의 기록 가져오기
      try {
        const { data, error } = await supabase
          .from('feedback_logs')
          .select('*')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Supabase DB 스키마 객체를 FeedbackLog 타입으로 변환
        const formattedLogs: FeedbackLog[] = (data || []).map((row: any) => ({
          id: row.id,
          date: row.date,
          totalMinutes: row.total_minutes,
          satisfaction: row.satisfaction,
          difficultyRating: row.difficulty_rating,
          sessionSummary: row.session_summary,
          memo: row.memo,
        }));
        
        setLogs(formattedLogs);
      } catch (e) {
        console.error('Failed to load logs from Supabase:', e);
      }
    } else {
      // 로컬스토리지 백업
      const savedLogs = localStorage.getItem('mulgyeol-feedback');
      if (savedLogs) {
        try {
          setLogs(JSON.parse(savedLogs));
        } catch (e) {
          console.error(e);
        }
      } else {
        setLogs([]);
      }
    }
    setLoadingLogs(false);
  };

  // 3. 기록 추가
  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();

    const logData = {
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      total_minutes: feedbackMinutes,
      satisfaction: feedbackSatisfaction,
      difficulty_rating: feedbackDifficulty,
      session_summary: feedbackSummary,
      memo: feedbackMemo,
    };

    if (user) {
      // Supabase DB에 인서트
      try {
        const { error } = await supabase.from('feedback_logs').insert({
          ...logData,
          user_id: user.id,
        });

        if (error) throw error;
        alert('훈련 기록이 데이터베이스에 저장되었습니다.');
        fetchLogs(user);
      } catch (err: any) {
        alert('저장 중 실패했습니다: ' + err.message);
      }
    } else {
      // 로컬스토리지에 임시 저장
      const newLog: FeedbackLog = {
        id: Date.now().toString(),
        date: logData.date,
        totalMinutes: logData.total_minutes,
        satisfaction: logData.satisfaction,
        difficultyRating: logData.difficulty_rating as any,
        sessionSummary: logData.session_summary,
        memo: logData.memo,
      };

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);
      localStorage.setItem('mulgyeol-feedback', JSON.stringify(updatedLogs));
      alert('비로그인 모드: 로컬스토리지에 저장되었습니다. 로그인 시 서버와 동기화됩니다.');
    }
    
    // 폼 리셋
    setFeedbackMemo('');
    setFeedbackSummary('자유형 및 평영 인터벌 훈련');
    setFeedbackSatisfaction(5);
  };

  // 4. 기록 삭제
  const handleDeleteLog = async (id: string) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;

    if (user) {
      try {
        const { error } = await supabase
          .from('feedback_logs')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id); // 타인 기록 삭제 방지

        if (error) throw error;
        alert('기록이 삭제되었습니다.');
        fetchLogs(user);
      } catch (err: any) {
        alert('삭제 실패: ' + err.message);
      }
    } else {
      const updatedLogs = logs.filter((log) => log.id !== id);
      setLogs(updatedLogs);
      localStorage.setItem('mulgyeol-feedback', JSON.stringify(updatedLogs));
      alert('기록이 삭제되었습니다.');
    }
  };

  // 통계 계산
  const totalSwimCount = logs.length;
  const totalSwimMinutes = logs.reduce((acc, curr) => acc + curr.totalMinutes, 0);
  const avgSatisfaction =
    totalSwimCount > 0
      ? (logs.reduce((acc, curr) => acc + curr.satisfaction, 0) / totalSwimCount).toFixed(1)
      : '0.0';

  // 루틴 생성 API 페이지로 넘어가기
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams({
      time: totalMinutes.toString(),
      stroke: preferredStroke,
      focus: preferredFocus,
      difficulty,
    }).toString();
    router.push(`/generator?${query}`);
  };

  return (
    <div className="space-y-12">
      {/* Non-login warning banner */}
      {!user && (
        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-600/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <h4 className="text-sm font-bold text-amber-400">비로그인 모드 작동 중</h4>
              <p className="text-[11px] text-slate-400">훈련 기록이 브라우저 임시 메모리에 저장됩니다. 로그인하시면 데이터를 서버에 안전하게 보관할 수 있습니다.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg whitespace-nowrap transition-colors"
          >
            로그인 및 서버 연동 &rarr;
          </Link>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-sky-950/70 to-slate-950 border border-sky-900/40 p-8 sm:p-12 shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#020617_1px,transparent_1px),linear-gradient(to_bottom,#020617_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35" />
        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Supabase DB 연동 버전
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight mb-4">
            물결치듯 매끄럽게,<br />
            당신의 수영을 <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">최적화</span>하세요
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed mb-8">
            수영 목표 시간에 부합하는 웜업, 본운동, 다운 시간을 정교하게 계산하고,<br />
            개인 맞춤 영법별 드릴 세트 루틴을 즉시 설계해 드립니다. 만족도 로그로 매일의 수영을 기록하세요.
          </p>
          <div className="flex flex-wrap gap-4">
            <a
              href="#generator-form"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/10 active:scale-98"
            >
              맞춤 루틴 생성하기
            </a>
            <Link
              href="/drills"
              className="inline-flex items-center justify-center px-6 py-3 text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl transition-all duration-300 active:scale-98"
            >
              드릴 비교 브라우저
            </Link>
          </div>
        </div>
      </section>

      {/* 2-Column Layout: Form & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Generator Form (8 cols on lg) */}
        <div id="generator-form" className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">맞춤형 세션 생성 엔진</h2>
              <p className="text-xs text-slate-400">훈련 시간과 옵션에 맞추어 루틴을 생성합니다.</p>
            </div>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            {/* 시간 입력 */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                목표 운동 시간: <span className="text-cyan-400 font-bold text-lg">{totalMinutes}</span>분
              </label>
              
              {/* 퀵 프리셋 버튼 */}
              <div className="flex gap-2 mb-3">
                {[30, 45, 60, 90, 120].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTotalMinutes(t)}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border transition-all ${
                      totalMinutes === t
                        ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {t}분
                  </button>
                ))}
              </div>

              <input
                type="range"
                min="15"
                max="180"
                step="5"
                value={totalMinutes}
                onChange={(e) => setTotalMinutes(Number(e.target.value))}
                className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                <span>15분</span>
                <span>60분</span>
                <span>120분</span>
                <span>180분</span>
              </div>
            </div>

            {/* 필터 그리드 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* 선호 영법 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">선호 영법</label>
                <select
                  value={preferredStroke}
                  onChange={(e) => setPreferredStroke(e.target.value as StrokeType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">전체 영법</option>
                  <option value="자유형">자유형 (Freestyle)</option>
                  <option value="배영">배영 (Backstroke)</option>
                  <option value="평영">평영 (Breaststroke)</option>
                  <option value="접영">접영 (Butterfly)</option>
                  <option value="혼영">개인혼영 (IM)</option>
                </select>
              </div>

              {/* 훈련 효과 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">훈련 효과</label>
                <select
                  value={preferredFocus}
                  onChange={(e) => setPreferredFocus(e.target.value as FocusType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">전체 효과</option>
                  <option value="자세/테크닉">자세/테크닉 교정</option>
                  <option value="지구력">심폐 & 근지구력</option>
                  <option value="스피드">단거리 스피드</option>
                  <option value="호흡">무호흡/폐활량</option>
                </select>
              </div>

              {/* 난이도 */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">난이도</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as '초급' | '중급' | '상급')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">모든 난이도</option>
                  <option value="초급">초급 (Beginner)</option>
                  <option value="중급">중급 (Intermediate)</option>
                  <option value="상급">상급 (Advanced)</option>
                </select>
              </div>
            </div>

            {/* 예상 분배 비율 프리뷰 */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-400">세션 분배 비율 미리보기</span>
              <div className="h-2 rounded-full bg-slate-900 flex overflow-hidden">
                <div className="h-full bg-sky-400" style={{ width: '25%' }} title="웜업 25%" />
                <div className="h-full bg-cyan-500" style={{ width: '60%' }} title="본운동 60%" />
                <div className="h-full bg-blue-600" style={{ width: '15%' }} title="정리운동 15%" />
              </div>
              <div className="grid grid-cols-3 text-center text-xs">
                <div>
                  <span className="block text-sky-400 font-bold">Warm-up (25%)</span>
                  <span className="text-slate-500">{(totalMinutes * 0.25).toFixed(1)}분</span>
                </div>
                <div className="border-x border-slate-900">
                  <span className="block text-cyan-400 font-bold">Main Set (60%)</span>
                  <span className="text-slate-500">{(totalMinutes * 0.6).toFixed(1)}분</span>
                </div>
                <div>
                  <span className="block text-blue-500 font-bold">Cool-down (15%)</span>
                  <span className="text-slate-500">{(totalMinutes * 0.15).toFixed(1)}분</span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 text-sm font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all duration-300 shadow-lg shadow-cyan-500/10 active:scale-98"
            >
              루틴 생성 및 시각화 &rarr;
            </button>
          </form>
        </div>

        {/* Right Column: Statistics (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Stats Cards */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4">훈련 요약 통계 {user && <span className="text-xs font-normal text-slate-400">({user.user_metadata?.full_name}님 기록)</span>}</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-center">
                <span className="block text-xs font-semibold text-slate-500 mb-1">총 수영 횟수</span>
                <span className="text-2xl font-black text-white">{totalSwimCount}회</span>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-center">
                <span className="block text-xs font-semibold text-slate-500 mb-1">누적 시간</span>
                <span className="text-2xl font-black text-cyan-400">{totalSwimMinutes}분</span>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-center">
                <span className="block text-xs font-semibold text-slate-500 mb-1">평균 만족도</span>
                <span className="text-2xl font-black text-amber-400">★ {avgSatisfaction}</span>
              </div>
            </div>
          </div>

          {/* Quick Logger Form */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl flex-grow">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-white">오늘의 수영 기록하기</h3>
                <p className="text-[10px] text-slate-400">
                  {user ? '서버 데이터베이스에 즉시 동기화 보관됩니다.' : '로그인하지 않은 상태로 로컬스토리지에 임시 저장됩니다.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleAddLog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">훈련 제목 / 요약</label>
                <input
                  type="text"
                  required
                  value={feedbackSummary}
                  onChange={(e) => setFeedbackSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">실제 수영 시간 (분)</label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    required
                    value={feedbackMinutes}
                    onChange={(e) => setFeedbackMinutes(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">체감 난이도</label>
                  <select
                    value={feedbackDifficulty}
                    onChange={(e) => setFeedbackDifficulty(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="너무 쉬움">너무 쉬움</option>
                    <option value="적당함">적당함</option>
                    <option value="너무 힘들었음">너무 힘들었음</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">만족도 별점</label>
                <div className="flex gap-2 items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackSatisfaction(star)}
                      className="text-lg focus:outline-none transition-transform hover:scale-110"
                    >
                      <span className={star <= feedbackSatisfaction ? 'text-amber-400' : 'text-slate-700'}>★</span>
                    </button>
                  ))}
                  <span className="text-xs text-slate-500 ml-2">({feedbackSatisfaction} / 5점)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">훈련 메모 (선택)</label>
                <textarea
                  rows={2}
                  value={feedbackMemo}
                  onChange={(e) => setFeedbackMemo(e.target.value)}
                  placeholder="오늘의 컨디션이나 드릴 보완점을 남기세요."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 placeholder-slate-600 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors active:scale-98"
              >
                기록 추가하기
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* Record log history databasebox */}
      <section className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 text-blue-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801-12c.065.21.1.433.1.664 0 .414-.336.75-.75.75h-4.5a.75.75 0 01-.75-.75c0-.231.035-.454.1-.664M6.75 7.5H4.81c-1.13 0-2.11.83-2.204 1.96a48.914 48.914 0 00-.08 1.123v11.108c0 1.135.845 2.098 1.976 2.192.127.01.253.02.38.029a8.9 8.9 0 001.86 0" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">기록 데이터박스 {user ? '(Supabase 연동 완료)' : '(로컬 임시보관)'}</h2>
              <p className="text-xs text-slate-400">수영 완료 만족도와 훈련 이력 목록입니다.</p>
            </div>
          </div>
        </div>

        {loadingLogs ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 bg-slate-950/40 rounded-xl border border-slate-900 border-dashed">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-slate-600 mx-auto mb-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <p className="text-sm text-slate-500">기록된 수영 로그가 없습니다. 루틴을 마치거나 위의 양식으로 기록을 작성해 보세요!</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[10px] text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">날짜</th>
                  <th className="py-3 px-4">훈련 내용 / 요약</th>
                  <th className="py-3 px-4 text-center">시간</th>
                  <th className="py-3 px-4 text-center">체감 난이도</th>
                  <th className="py-3 px-4 text-center">만족도</th>
                  <th className="py-3 px-4">피드백 메모</th>
                  <th className="py-3 px-4 text-center">동작</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 bg-slate-950/30">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-400 whitespace-nowrap">{log.date}</td>
                    <td className="py-4 px-4 text-white font-bold">{log.sessionSummary}</td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">{log.totalMinutes}분</td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.difficultyRating === '너무 힘들었음'
                            ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                            : log.difficultyRating === '적당함'
                            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                            : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                        }`}
                      >
                        {log.difficultyRating}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-amber-400 whitespace-nowrap font-bold">
                      {'★'.repeat(log.satisfaction)}
                      <span className="text-slate-600">{'★'.repeat(5 - log.satisfaction)}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-400 max-w-xs truncate" title={log.memo}>
                      {log.memo || <span className="text-slate-600">-</span>}
                    </td>
                    <td className="py-4 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="text-red-500 hover:text-red-400 font-semibold transition-colors px-2 py-1"
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
