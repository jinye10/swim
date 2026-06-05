// 파일경로: src/app/board/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface SharedVideo {
  id: string;
  user_id: string;
  user_name: string;
  title: string;
  youtube_url: string;
  description: string;
  created_at: string;
}

function getYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function VideoBoard() {
  const router = useRouter();

  // 로그인 세션 상태
  const [user, setUser] = useState<any>(null);
  
  // 게시글 관련 상태
  const [posts, setPosts] = useState<SharedVideo[]>([]);
  const [loading, setLoading] = useState(true);

  // 등록 폼 상태
  const [title, setTitle] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 팝업 재생용 상태
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    // 세션 및 유저 체크
    supabase.auth.getSession().then((res: any) => {
      const session = res.data?.session;
      setUser(session ? session.user : null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      setUser(session ? session.user : null);
    });

    fetchPosts();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // 목록 가져오기
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('shared_videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts: SharedVideo[] = (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        user_name: row.user_name || '익명 스위머',
        title: row.title,
        youtube_url: row.youtube_url,
        description: row.description || '',
        created_at: new Date(row.created_at).toLocaleDateString('ko-KR', {
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));

      setPosts(formattedPosts);
    } catch (e) {
      console.error('Failed to load shared videos:', e);
    } finally {
      setLoading(false);
    }
  };

  // 등록 요청
  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert('로그인한 회원만 영상을 공유할 수 있습니다.');
      return;
    }

    const videoId = getYouTubeId(youtubeUrl);
    if (!videoId) {
      alert('올바른 유튜브 링크를 입력해 주세요. (예: https://www.youtube.com/watch?v=...)');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('shared_videos').insert({
        user_id: user.id,
        user_name: user.user_metadata?.full_name || '스위머',
        title,
        youtube_url: youtubeUrl,
        description,
      });

      if (error) throw error;

      alert('유튜브 영상이 성공적으로 공유되었습니다!');
      setTitle('');
      setYoutubeUrl('');
      setDescription('');
      fetchPosts();
    } catch (err: any) {
      alert('공유 실패: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 삭제 요청
  const handleDeletePost = async (id: string, postUserId: string) => {
    if (!user) return;
    if (user.id !== postUserId) {
      alert('본인이 작성한 게시물만 삭제할 수 있습니다.');
      return;
    }

    if (!confirm('공유한 영상을 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('shared_videos')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      alert('공유된 영상이 삭제되었습니다.');
      fetchPosts();
    } catch (err: any) {
      alert('삭제 실패: ' + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-3xl font-extrabold text-white">유튜브 추천 훈련 공유판</h1>
          <p className="text-sm text-slate-400 mt-1">스위머들이 함께 연습하기 좋은 우수한 수영 교정/훈련 유튜브 영상을 추천하고 공유하는 소통 공간입니다.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Post Form (4 cols on lg) */}
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm shadow-xl h-fit">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4 text-red-500">
                <path d="M23 12c0 6.075-4.925 11-11 11S1 18.075 1 12 5.925 1 12 1s11 4.925 11 11zm-13.5 4.5l6-4.5-6-4.5v9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">동영상 공유하기</h3>
              <p className="text-[10px] text-slate-400">훈련 효과가 좋은 유튜브 영상 링크를 공유해 주세요.</p>
            </div>
          </div>

          {user ? (
            <form onSubmit={handlePostSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">영상 추천 제목</label>
                <input
                  type="text"
                  required
                  placeholder="예: '자유형 롤링할 때 무조건 봐야 하는 3가지 팁'"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">유튜브 링크 (URL)</label>
                <input
                  type="url"
                  required
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 placeholder-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">추천 이유 / 훈련 포인트</label>
                <textarea
                  rows={4}
                  placeholder="예: '2분 30초 부분부터 나오는 글라이딩 정지 동작을 풀사이드에서 따라 하면 자유형 하이엘보 릴렉스 감각이 정말 좋아집니다! 강추합니다.'"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500 placeholder-slate-700 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-xl hover:from-cyan-300 hover:to-blue-400 transition-all active:scale-98 disabled:opacity-50"
              >
                {submitting ? '등록 처리 중...' : '게시하기'}
              </button>
            </form>
          ) : (
            <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 text-center space-y-3">
              <p className="text-xs text-slate-400">로그인하시면 연습하기에 좋은 추천 유튜브 영상을 공유 게시판에 올리실 수 있습니다.</p>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
              >
                로그인하러 가기
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Shared Videos Grid (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-10 h-10 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-slate-800 border-dashed">
              <p className="text-sm text-slate-500">아직 공유된 추천 영상이 없습니다. 첫 번째 추천 영상을 올려보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {posts.map((post) => {
                const videoId = getYouTubeId(post.youtube_url);
                return (
                  <div
                    key={post.id}
                    className="group flex flex-col justify-between bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-sm shadow-lg transition-all duration-300 hover:-translate-y-1"
                  >
                    <div>
                      {/* Video Thumbnail Embed Button */}
                      {videoId && (
                        <div
                          onClick={() => setActiveVideoUrl(post.youtube_url)}
                          className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-800 shadow-md mb-4 cursor-pointer group/thumb"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500 opacity-80 group-hover/thumb:opacity-100"
                          />
                          <div className="absolute inset-0 bg-slate-950/20 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-xl shadow-red-600/20 transform group-hover/thumb:scale-110 transition-transform">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5">
                                <path d="M8 5v14l11-7z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}

                      <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug">
                        {post.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-800/60 mt-4 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span>추천자: <span className="text-slate-300 font-semibold">{post.user_name}</span></span>
                        <span className="block text-[10px] text-slate-600 mt-0.5">{post.created_at}</span>
                      </div>
                      
                      {user && user.id === post.user_id && (
                        <button
                          onClick={() => handleDeletePost(post.id, post.user_id)}
                          className="text-red-500 hover:text-red-400 font-semibold px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800/80 hover:border-slate-800 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

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
                  유튜브 동영상 ID를 분석할 수 없는 형식의 링크입니다.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
