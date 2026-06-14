// 파일경로: src/app/drills/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { SwimDrill, StrokeType, FocusType } from '@/types/swim';
import { supabase } from '@/lib/supabase';

// 유튜브 URL에서 비디오 ID를 추출하는 헬퍼 함수
function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function DrillsPage() {
  const [drills, setDrills] = useState<SwimDrill[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [selectedStroke, setSelectedStroke] = useState<StrokeType | ''>('');
  const [selectedFocus, setSelectedFocus] = useState<FocusType | ''>('');
  
  // 비교 데크에 선택된 드릴 목록
  const [comparedDrills, setComparedDrills] = useState<SwimDrill[]>([]);

  // 유튜브 팝업 재생용 상태
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  // Supabase에서 드릴 가져오기
  const fetchDrills = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('drills')
        .select('*')
        .order('id', { ascending: true });

if (error) throw error;

console.log('Supabase data:', data);
console.log('Supabase error:', error);

// DB 스키마 카멜케이스 매핑
const formattedDrills: SwimDrill[] = (data || []).map((row: any) => ({
  id: row.id,
  name: row.name,
  description: row.description,
  stroke: row.stroke as StrokeType,
  focus: row.focus as FocusType,
  phase: row.phase as any,
  difficulty: row.difficulty as any,
  intensity: row.intensity,
  estimatedMinutesPer100m: Number(
    row.estimated_minutes_per_100m || row.estimatedMinutesPer100m
  ),
  defaultDistance:
    row.default_distance || row.defaultDistance,
  youtubeUrl:
    row.youtube_url || row.youtubeUrl,
}));

setDrills(formattedDrills);

  // 필터링 적용
  const filteredDrills = drills.filter((drill) => {
    const matchesStroke = selectedStroke === '' || drill.stroke === selectedStroke;
    const matchesFocus = selectedFocus === '' || drill.focus === selectedFocus;
    return matchesStroke && matchesFocus;
  });

  // 비교 데크에 추가/제거 토글
  const toggleCompare = (drill: SwimDrill) => {
    if (comparedDrills.find((d) => d.id === drill.id)) {
      setComparedDrills(comparedDrills.filter((d) => d.id !== drill.id));
    } else {
      if (comparedDrills.length >= 4) {
        alert('비교는 한 번에 최대 4개까지만 가능합니다.');
        return;
      }
      setComparedDrills([...comparedDrills, drill]);
    }
  };

  // 비교 데크 비우기
  const clearCompared = () => {
    setComparedDrills([]);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white">수영 드릴 라이브러리</h1>
          <p className="text-sm text-slate-400 mt-1">영법별 자세 교정과 능력 향상을 돕는 정예 수영 드릴 세트입니다.</p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 self-start md:self-auto">
          라이브러리 등록 개수: <span className="font-bold text-cyan-400">{drills.length}개</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900/40 border border-slate-900 rounded-xl p-4 space-y-4">
        {/* 영법 필터 */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">영법 구분</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedStroke('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedStroke === ''
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              전체 영법
            </button>
            {(['자유형', '배영', '평영', '접영', '혼영', '공통'] as StrokeType[]).map((stroke) => (
              <button
                key={stroke}
                onClick={() => setSelectedStroke(stroke)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedStroke === stroke
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                {stroke}
              </button>
            ))}
          </div>
        </div>

        {/* 목적 필터 */}
        <div>
          <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">훈련 효과 / 목적</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedFocus('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                selectedFocus === ''
                  ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                  : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
              }`}
            >
              전체 효과
            </button>
            {(['자세/테크닉', '지구력', '스피드', '호흡', '웜업', '정리'] as FocusType[]).map((focus) => (
              <button
                key={focus}
                onClick={() => setSelectedFocus(focus)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                  selectedFocus === focus
                    ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400 font-bold'
                    : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                }`}
              >
                {focus}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Comparison Deck */}
      {comparedDrills.length > 0 && (
        <section className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h2 className="text-lg font-bold text-white">드릴 비교 데크 ({comparedDrills.length}/4)</h2>
            </div>
            <button
              onClick={clearCompared}
              className="text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              모두 비우기
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
            <table className="w-full text-left text-xs text-slate-300 min-w-[600px] border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-slate-800 text-[10px] uppercase text-slate-400 tracking-wider">
                  <th className="p-3 w-1/5">항목</th>
                  {comparedDrills.map((drill) => (
                    <th key={drill.id} className="p-3 w-1/5 font-bold text-cyan-400 text-sm relative">
                      <div className="flex justify-between items-center">
                        <span className="truncate max-w-[120px]">{drill.name}</span>
                        <button
                          onClick={() => toggleCompare(drill)}
                          className="text-red-400 hover:text-red-300 font-bold ml-1 text-xs"
                          title="제거"
                        >
                          ✕
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* 빈 칸 패딩 */}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <th key={i} className="p-3 w-1/5 text-slate-700 italic font-normal text-center">비교할 드릴 선택</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="p-3 font-semibold text-slate-500">영법</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 font-bold text-slate-200">{d.stroke}</td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">훈련 목적</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 text-cyan-300">{d.focus}</td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">추천 단계</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        d.phase === 'warmup' ? 'bg-sky-500/10 text-sky-400' :
                        d.phase === 'main' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {d.phase === 'warmup' ? '웜업' : d.phase === 'main' ? '본운동' : '다운'}
                      </span>
                    </td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">훈련 난이도</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        d.difficulty === '상급' ? 'bg-red-500/10 text-red-400' :
                        d.difficulty === '중급' ? 'bg-cyan-500/10 text-cyan-400' :
                        'bg-slate-800 text-slate-400'
                      }`}>
                        {d.difficulty}
                      </span>
                    </td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">훈련 강도</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 text-amber-400">
                      {'★'.repeat(d.intensity)}
                      <span className="text-slate-700">{'★'.repeat(5 - d.intensity)}</span>
                    </td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">추천 1세트 거리</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 text-white font-semibold">{d.defaultDistance}m</td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">100m 기준 페이스</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 text-slate-300">약 {d.estimatedMinutesPer100m}분</td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
                <tr>
                  <td className="p-3 font-semibold text-slate-500">드릴 설명</td>
                  {comparedDrills.map((d) => (
                    <td key={d.id} className="p-3 text-xs text-slate-400 leading-normal align-top max-w-[200px] break-words">
                      {d.description}
                    </td>
                  ))}
                  {Array.from({ length: 4 - comparedDrills.length }).map((_, i) => (
                    <td key={i} className="p-3 text-center text-slate-800">-</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Drill Cards Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDrills.map((drill) => {
            const isCompared = !!comparedDrills.find((d) => d.id === drill.id);
            return (
              <div
                key={drill.id}
                className={`group relative flex flex-col justify-between bg-slate-900/60 border rounded-2xl p-6 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  isCompared
                    ? 'border-cyan-500 shadow-cyan-500/5 bg-slate-900/90'
                    : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {/* 영법 태그 */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-400 border border-cyan-900">
                        {drill.stroke}
                      </span>
                      {/* 목적 태그 */}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-950 text-slate-400 border border-slate-800">
                        {drill.focus}
                      </span>
                    </div>

                    {/* 난이도 배지 */}
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-extrabold ${
                        drill.difficulty === '상급'
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : drill.difficulty === '중급'
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700/50'
                      }`}
                    >
                      {drill.difficulty}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors leading-tight mb-2">
                    {drill.name}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {drill.description}
                  </p>
                </div>

                {/* Card Bottom */}
                <div className="pt-4 border-t border-slate-800 mt-4 space-y-4">
                  {/* 유튜브 영상 연동 여부 */}
                  {drill.youtubeUrl && (
                    <button
                      onClick={() => setActiveVideoUrl(drill.youtubeUrl!)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 text-xs font-bold text-red-400 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        className="w-4 h-4 text-red-500"
                      >
                        <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z" />
                      </svg>
                      유튜브 가이드 시청하기
                    </button>
                  )}

                  <div className="flex items-center justify-between text-xs pt-1">
                    {/* 강도 */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500">강도:</span>
                      <span className="text-amber-400 font-bold">
                        {'★'.repeat(drill.intensity)}
                        <span className="text-slate-700">{'★'.repeat(5 - drill.intensity)}</span>
                      </span>
                    </div>
                    {/* 추천 거리 */}
                    <div className="text-slate-400">
                      추천 세트: <span className="font-semibold text-white">{drill.defaultDistance}m</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 pt-1">
                    <span className="text-[10px] text-slate-500">
                      예상 페이스: <span className="text-slate-300 font-semibold">{drill.estimatedMinutesPer100m}분/100m</span>
                    </span>
                    
                    <button
                      onClick={() => toggleCompare(drill)}
                      className={`inline-flex items-center justify-center px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 ${
                        isCompared
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                          : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                      }`}
                    >
                      {isCompared ? '비교 해제' : '비교 담기'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredDrills.length === 0 && (
            <div className="col-span-full text-center py-16 bg-slate-900/20 rounded-2xl border border-slate-900 border-dashed">
              <p className="text-sm text-slate-500">선택한 필터 조건에 부합하는 드릴이 없습니다. 다른 필터를 선택해 주세요.</p>
            </div>
          )}
        </div>
      )}

      {/* YouTube Video Player Modal */}
      {activeVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative">
            <button
              onClick={() => setActiveVideoUrl(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 text-white font-bold flex items-center justify-center hover:bg-slate-700 active:scale-90 transition-transform"
            >
              ✕
            </button>
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black shadow-inner border border-slate-800">
              {getYouTubeId(activeVideoUrl) ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${getYouTubeId(activeVideoUrl)}?autoplay=1`}
                  title="YouTube video player"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400 p-8 text-center">
                  유튜브 동영상 ID를 분석할 수 없는 형식의 링크입니다.<br />
                  링크: <a href={activeVideoUrl} target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline ml-1">{activeVideoUrl}</a>
                </div>
              )}
            </div>
            <div className="mt-4 text-center">
              <p className="text-xs text-slate-500">동영상이 정상 작동하지 않는다면 창을 닫고 다시 시도해 주시기 바랍니다.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
