// 파일경로: src/app/generator/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { SwimSession, FeedbackLog } from '@/types/swim';
import { supabase } from '@/lib/supabase';

function SessionGeneratorInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // API 파라미터 추출
  const timeParam = searchParams.get('time');
  const strokeParam = searchParams.get('stroke') || '';
  const focusParam = searchParams.get('focus') || '';
  const diffParam = searchParams.get('difficulty') || '';

  const totalMinutes = timeParam ? parseInt(timeParam, 10) : 60;

  // 상태 관리
  const [session, setSession] = useState<SwimSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  
  // 피드백 모달 상태
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [satisfaction, setSatisfaction] = useState<number>(5);
  const [difficultyRating, setDifficultyRating] = useState<'너무 쉬움' | '적당함' | '너무 힘들었음'>('적당함');
  const [memo, setMemo] = useState<string>('');

  // 사용자 정보 로드
  useEffect(() => {
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      setUser(session ? session.user : null);
    });
  }, []);

  // 루틴 API 요청
  useEffect(() => {
    async function fetchSession() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            totalMinutes,
            preferredStroke: strokeParam || undefined,
            preferredFocus: focusParam || undefined,
            difficulty: diffParam || undefined,
          }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || '루틴을 생성하지 못했습니다.');
        }

        const data: SwimSession = await response.json();
        setSession(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [totalMinutes, strokeParam, focusParam, diffParam]);

  // 만족도 기록 저장 (Supabase 연동 및 로컬스토리지 백업)
  const handleSaveFeedback = async () => {
    if (!session) return;

    // 요약 타이틀 빌드 (예: "자유형 중심 60분 루틴")
    const strokeText = strokeParam ? `${strokeParam} 중심 ` : '개인 맞춤형 ';
    const summaryText = `${strokeText}${totalMinutes}분 추천 루틴`;

    const logData = {
      date: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }),
      total_minutes: totalMinutes,
      satisfaction,
      difficulty_rating: difficultyRating,
      session_summary: summaryText,
      memo,
    };

    if (user) {
      // 1) 로그인된 경우 -> Supabase 인서트
      try {
        const { error } = await supabase.from('feedback_logs').insert({
          ...logData,
          user_id: user.id,
        });

        if (error) throw error;
        alert('오늘의 수영 훈련 피드백이 서버베이스 데이터베이스에 저장되었습니다!');
      } catch (err: any) {
        alert('서버 저장 실패: ' + err.message + '\n임시 로컬스토리지 저장을 시도합니다.');
        saveToLocalStorage(logData, summaryText);
      }
    } else {
      // 2) 로그인되지 않은 경우 -> LocalStorage
      saveToLocalStorage(logData, summaryText);
    }

    setIsModalOpen(false);
    router.push('/');
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  const saveToLocalStorage = (logData: any, summaryText: string) => {
    const newLog: FeedbackLog = {
      id: Date.now().toString(),
      date: logData.date,
      totalMinutes: logData.total_minutes,
      satisfaction: logData.satisfaction,
      difficultyRating: logData.difficulty_rating,
      memo: logData.memo,
      sessionSummary: summaryText,
    };

    const savedLogs = localStorage.getItem('mulgyeol-feedback');
    let logsArray: FeedbackLog[] = [];
    if (savedLogs) {
      try {
        logsArray = JSON.parse(savedLogs);
      } catch (e) {
        console.error(e);
      }
    }

    localStorage.setItem('mulgyeol-feedback', JSON.stringify([newLog, ...logsArray]));
    alert('비로그인 상태: 오늘의 수영 피드백이 브라우저 로컬스토리지에 임시 저장되었습니다.');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">물결 루틴 생성 중...</h2>
          <p className="text-xs text-slate-400 mt-1">시간 분배 비율을 계산하고 최적의 훈련 드릴을 조합하고 있습니다.</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-red-500/20 max-w-xl mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 text-red-400 mx-auto mb-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
        </svg>
        <h2 className="text-lg font-bold text-white mb-2">루틴 생성에 실패했습니다.</h2>
        <p className="text-xs text-slate-400 mb-6">{error || '네트워크 상태를 확인해 주세요.'}</p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 text-xs font-bold bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  // 총 합계 실제 구성 분 & 총 훈련 거리 구하기
  const actualTotalMinutes = 
    session.warmup.actualMinutes + 
    session.main.actualMinutes + 
    session.cooldown.actualMinutes;

  const totalDistance = 
    session.warmup.items.reduce((acc, curr) => acc + curr.distance, 0) +
    session.main.items.reduce((acc, curr) => acc + curr.distance, 0) +
    session.cooldown.items.reduce((acc, curr) => acc + curr.distance, 0);

  return (
    <div className="space-y-8">
      {/* Header Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white">생성된 맞춤형 수영 루틴</h1>
          <p className="text-sm text-slate-400 mt-1">
            설정값: <span className="text-cyan-400 font-bold">{totalMinutes}분 훈련</span>
            {strokeParam && ` • 선호 영법: ${strokeParam}`}
            {focusParam && ` • 목적: ${focusParam}`}
            {diffParam && ` • 난이도: ${diffParam}`}
          </p>
        </div>
        
        {/* Core Metrics Deck */}
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-2.5 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase">예상 총 시간</span>
            <span className="text-xl font-black text-cyan-400">{actualTotalMinutes.toFixed(1)}분</span>
          </div>
          <div className="bg-slate-900 border border-slate-800/80 rounded-xl px-4 py-2.5 text-center">
            <span className="block text-[10px] font-semibold text-slate-500 uppercase">총 수영 거리</span>
            <span className="text-xl font-black text-white">{totalDistance}m</span>
          </div>
        </div>
      </div>

      {/* Progress Bars showing distributions */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <h2 className="text-sm font-bold text-white mb-4">루틴 시간 분배 상세 비교</h2>
        <div className="space-y-4">
          {/* Warmup row */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-sky-400">Warm-up (웜업)</span>
              <span className="text-slate-400">
                목표 {session.warmup.targetMinutes}분 / <span className="font-bold text-white">실제 {session.warmup.actualMinutes}분</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-sky-400 transition-all"
                style={{ width: `${(session.warmup.actualMinutes / actualTotalMinutes) * 100}%` }}
              />
            </div>
          </div>

          {/* Main Set row */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-cyan-400">Main Set (본운동)</span>
              <span className="text-slate-400">
                목표 {session.main.targetMinutes}분 / <span className="font-bold text-white">실제 {session.main.actualMinutes}분</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${(session.main.actualMinutes / actualTotalMinutes) * 100}%` }}
              />
            </div>
          </div>

          {/* Cooldown row */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-blue-500">Cool-down (정리운동)</span>
              <span className="text-slate-400">
                목표 {session.cooldown.targetMinutes}분 / <span className="font-bold text-white">실제 {session.cooldown.actualMinutes}분</span>
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-slate-950 overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all"
                style={{ width: `${(session.cooldown.actualMinutes / actualTotalMinutes) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Connected Timeline Workout Steps */}
      <section className="relative pl-6 sm:pl-8 space-y-12 before:absolute before:left-[11px] before:sm:left-[15px] before:top-4 before:bottom-4 before:w-0.5 before:bg-gradient-to-b before:from-sky-400 before:via-cyan-500 before:to-blue-600">
        
        {/* Phase 1: WARM-UP */}
        <div className="relative">
          {/* Phase Badge timeline indicator */}
          <div className="absolute -left-[27px] sm:-left-[31px] top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-slate-950 bg-sky-400 flex items-center justify-center text-[10px] sm:text-xs text-slate-950 font-black">
            1
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-sky-400 flex items-center gap-2">
                웜업 세션 (Warm-up)
                <span className="text-xs text-slate-500 font-normal">| 체온 및 심박수 상승, 물감각 적응</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">총 {session.warmup.actualMinutes}분 매칭</p>
            </div>

            {session.warmup.items.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/30 text-xs text-slate-500 border border-slate-800">
                해당하는 웜업 드릴이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {session.warmup.items.map((item, index) => (
                  <WorkoutItemCard key={index} item={item} colorClass="sky" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase 2: MAIN SET */}
        <div className="relative">
          {/* Phase Badge timeline indicator */}
          <div className="absolute -left-[27px] sm:-left-[31px] top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-slate-950 bg-cyan-500 flex items-center justify-center text-[10px] sm:text-xs text-slate-950 font-black">
            2
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2">
                본운동 세션 (Main Set)
                <span className="text-xs text-slate-500 font-normal">| 핵심 체력 단련 및 영법 자세 교정</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">총 {session.main.actualMinutes}분 매칭</p>
            </div>

            {session.main.items.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/30 text-xs text-slate-500 border border-slate-800">
                해당하는 본운동 드릴이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {session.main.items.map((item, index) => (
                  <WorkoutItemCard key={index} item={item} colorClass="cyan" />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Phase 3: COOL-DOWN */}
        <div className="relative">
          {/* Phase Badge timeline indicator */}
          <div className="absolute -left-[27px] sm:-left-[31px] top-1 w-6 h-6 sm:w-8 sm:h-8 rounded-full border-4 border-slate-950 bg-blue-600 flex items-center justify-center text-[10px] sm:text-xs text-slate-950 font-black">
            3
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-blue-500 flex items-center gap-2">
                정리운동 세션 (Cool-down)
                <span className="text-xs text-slate-500 font-normal">| 젖산 제거 및 스트레칭, 이완</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">총 {session.cooldown.actualMinutes}분 매칭</p>
            </div>

            {session.cooldown.items.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-900/30 text-xs text-slate-500 border border-slate-800">
                해당하는 정리운동 드릴이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {session.cooldown.items.map((item, index) => (
                  <WorkoutItemCard key={index} item={item} colorClass="blue" />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Completion CTA Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 border-t border-slate-900">
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl hover:from-emerald-300 hover:to-cyan-300 transition-all duration-300 shadow-lg shadow-emerald-500/10 active:scale-98"
        >
          훈련 완료! 만족도 기록하기
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 text-sm font-bold text-slate-300 hover:text-white bg-slate-905 border border-slate-800 rounded-xl hover:bg-slate-800 transition-all active:scale-98"
        >
          대시보드로 돌아가기
        </button>
      </div>

      {/* Feedback Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white font-bold"
            >
              ✕
            </button>
            <div>
              <h3 className="text-xl font-bold text-white">수영 훈련 완료 피드백</h3>
              <p className="text-xs text-slate-400 mt-1">오늘 진행한 생성 루틴의 소감과 만족도를 간략히 기록하세요.</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">체감 만족도 별점</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSatisfaction(star)}
                      className="text-2xl focus:outline-none transition-transform hover:scale-110"
                    >
                      <span className={star <= satisfaction ? 'text-amber-400' : 'text-slate-700'}>★</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">체감 운동 강도 / 난이도</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['너무 쉬움', '적당함', '너무 힘들었음'] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDifficultyRating(r)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        difficultyRating === r
                          ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">훈련 메모</label>
                <textarea
                  rows={3}
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="예: '접영 출수킥 타이밍 맞추기가 여전히 까다롭다. 물감이 좋았음.'"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 placeholder-slate-600 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveFeedback}
                className="flex-1 py-2.5 text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg transition-colors"
              >
                저장하고 완료하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 개별 운동 카드로 감싼 컴포넌트
interface WorkoutItemProps {
  item: any;
  colorClass: 'sky' | 'cyan' | 'blue';
}

function WorkoutItemCard({ item, colorClass }: WorkoutItemProps) {
  const borderColors = {
    sky: 'border-sky-500/20 hover:border-sky-400/40',
    cyan: 'border-cyan-500/20 hover:border-cyan-400/40',
    blue: 'border-blue-500/20 hover:border-blue-400/40',
  };

  const textColors = {
    sky: 'text-sky-400',
    cyan: 'text-cyan-400',
    blue: 'text-blue-500',
  };

  return (
    <div className={`bg-slate-900/40 border ${borderColors[colorClass]} rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors duration-300`}>
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="text-base font-bold text-white">{item.drill.name}</h4>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-950 text-slate-400 border border-slate-800">
            {item.drill.stroke}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-950 text-slate-400 border border-slate-800">
            {item.drill.focus}
          </span>
        </div>
        <p className="text-xs text-slate-400 leading-normal max-w-2xl">{item.drill.description}</p>
      </div>

      <div className="flex flex-col sm:items-end justify-center min-w-[180px] shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/60">
        <span className={`text-sm font-extrabold ${textColors[colorClass]}`}>
          {item.drill.defaultDistance}m x {item.reps}회 ({item.distance}m)
        </span>
        <span className="text-[11px] text-slate-400 mt-1 font-semibold">{item.targetPace}</span>
        <span className="text-[10px] text-slate-500 mt-0.5">예상 소요: 약 {item.duration}분</span>
      </div>
    </div>
  );
}

// Suspense 경계로 감싼 최종 Page 익스포트
export default function GeneratorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-pulse" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-cyan-500 animate-spin" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">데이터 파싱 및 로딩 중...</h2>
          </div>
        </div>
      }
    >
      <SessionGeneratorInner />
    </Suspense>
  );
}
