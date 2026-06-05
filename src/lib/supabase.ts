// 파일경로: src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';
import { INITIAL_DRILLS } from '@/types/swim';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// 실제 Supabase 클라이언트 연결 시도
export const isRealSupabase = !!(supabaseUrl && supabaseAnonKey);

let realSupabase: any = null;
if (isRealSupabase) {
  try {
    realSupabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Supabase initialization failed:', e);
  }
}

// --- MOCK SUPABASE CLIENT IMPLEMENTATION ---
// 환경변수가 없는 로컬 환경에서 회원가입, 로그인, DB 쿼리를 Mocking하기 위한 임시 클래스입니다.

type AuthCallback = (event: string, session: any) => void;
const authListeners = new Set<AuthCallback>();

const getMockSession = () => {
  if (typeof window === 'undefined') return null;
  const session = localStorage.getItem('mulgyeol-mock-session');
  return session ? JSON.parse(session) : null;
};

const triggerAuthChange = (event: string, session: any) => {
  authListeners.forEach((listener) => listener(event, session));
};

// 가상 쿼리 빌더 클래스
class MockQueryBuilder {
  private table: string;
  private filters: Array<(item: any) => boolean> = [];
  private sortKey: string | null = null;
  private ascending: boolean = true;

  constructor(table: string) {
    this.table = table;
  }

  select(columns?: string) {
    // 복잡한 컬럼 파싱 생략, 전체 데이터 전달용
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push((item) => item[column] === value);
    return this;
  }

  order(column: string, { ascending = true } = {}) {
    this.sortKey = column;
    this.ascending = ascending;
    return this;
  }

  // 데이터 조회 실행
  async then(onfulfilled?: (value: any) => any) {
    if (typeof window === 'undefined') {
      const res = { data: [], error: null };
      return onfulfilled ? onfulfilled(res) : res;
    }

    let data = [];
    const storageKey = `mulgyeol-mock-${this.table}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      data = JSON.parse(saved);
    } else {
      // 초기 기본 데이터 적재
      if (this.table === 'drills') {
        data = [...INITIAL_DRILLS];
        localStorage.setItem(storageKey, JSON.stringify(data));
      } else {
        data = [];
      }
    }

    // 필터링 적용
    for (const filter of this.filters) {
      data = data.filter(filter);
    }

    // 정렬 적용
    if (this.sortKey) {
      const key = this.sortKey;
      data.sort((a: any, b: any) => {
        if (a[key] === undefined || b[key] === undefined) return 0;
        if (a[key] < b[key]) return this.ascending ? -1 : 1;
        if (a[key] > b[key]) return this.ascending ? 1 : -1;
        return 0;
      });
    }

    const result = { data, error: null };
    return onfulfilled ? onfulfilled(result) : result;
  }

  // 데이터 추가
  async insert(data: any | any[]) {
    if (typeof window === 'undefined') return { data: null, error: null };

    const storageKey = `mulgyeol-mock-${this.table}`;
    const saved = localStorage.getItem(storageKey);
    const currentData = saved ? JSON.parse(saved) : [];

    const itemsToAdd = Array.isArray(data) ? data : [data];
    const newItems = itemsToAdd.map((item) => ({
      id: item.id || Math.random().toString(36).substring(2, 9),
      created_at: new Date().toISOString(),
      ...item,
    }));

    const updatedData = [...newItems, ...currentData];
    localStorage.setItem(storageKey, JSON.stringify(updatedData));

    return { data: newItems, error: null };
  }

  // 데이터 수정
  async update(updateValues: any) {
    if (typeof window === 'undefined') return { data: null, error: null };

    const storageKey = `mulgyeol-mock-${this.table}`;
    const saved = localStorage.getItem(storageKey);
    let currentData = saved ? JSON.parse(saved) : (this.table === 'drills' ? [...INITIAL_DRILLS] : []);

    let updatedCount = 0;
    currentData = currentData.map((item: any) => {
      // 현재 누적된 필터 조건에 부합하는 대상만 업데이트
      const isTarget = this.filters.every((filter) => filter(item));
      if (isTarget) {
        updatedCount++;
        return { ...item, ...updateValues };
      }
      return item;
    });

    localStorage.setItem(storageKey, JSON.stringify(currentData));
    return { data: currentData, error: null, count: updatedCount };
  }

  // 데이터 삭제
  async delete() {
    if (typeof window === 'undefined') return { data: null, error: null };

    const storageKey = `mulgyeol-mock-${this.table}`;
    const saved = localStorage.getItem(storageKey);
    let currentData = saved ? JSON.parse(saved) : [];

    const beforeLength = currentData.length;
    // 필터 조건에 부합하지 않는(남겨둘) 데이터들만 필터링
    currentData = currentData.filter((item: any) => {
      const isTarget = this.filters.every((filter) => filter(item));
      return !isTarget;
    });

    localStorage.setItem(storageKey, JSON.stringify(currentData));
    return { data: null, error: null, count: beforeLength - currentData.length };
  }
}

// 가상 Auth 모듈
const mockAuth = {
  async signUp({ email, password, options }: any) {
    if (typeof window === 'undefined') return { data: null, error: new Error('Server error') };

    const usersSaved = localStorage.getItem('mulgyeol-mock-users');
    const users = usersSaved ? JSON.parse(usersSaved) : [];

    if (users.find((u: any) => u.email === email)) {
      return { data: { user: null }, error: { message: '이미 가입된 아이디(이메일)입니다.' } };
    }

    const newUser = {
      id: Math.random().toString(36).substring(2, 15),
      email,
      user_metadata: options?.data || {},
    };

    users.push({ ...newUser, password });
    localStorage.setItem('mulgyeol-mock-users', JSON.stringify(users));

    return { data: { user: newUser }, error: null };
  },

  async signInWithPassword({ email, password }: any) {
    if (typeof window === 'undefined') return { data: null, error: new Error('Server error') };

    const usersSaved = localStorage.getItem('mulgyeol-mock-users');
    const users = usersSaved ? JSON.parse(usersSaved) : [];

    const user = users.find((u: any) => u.email === email && u.password === password);
    if (!user) {
      return { data: { session: null, user: null }, error: { message: '아이디 또는 패스워드가 올바르지 않습니다.' } };
    }

    const session = {
      access_token: 'mock-token-' + Math.random(),
      user: {
        id: user.id,
        email: user.email,
        user_metadata: user.user_metadata,
      },
    };

    localStorage.setItem('mulgyeol-mock-session', JSON.stringify(session));
    triggerAuthChange('SIGNED_IN', session);

    return { data: { session, user: session.user }, error: null };
  },

  async signOut() {
    if (typeof window === 'undefined') return { error: null };
    localStorage.removeItem('mulgyeol-mock-session');
    triggerAuthChange('SIGNED_OUT', null);
    return { error: null };
  },

  async getSession() {
    return { data: { session: getMockSession() }, error: null };
  },

  async getUser() {
    const session = getMockSession();
    return { data: { user: session ? session.user : null }, error: null };
  },

  onAuthStateChange(callback: AuthCallback) {
    authListeners.add(callback);
    // 현재 초기 세션 한번 전송
    const currentSession = getMockSession();
    callback('INITIAL_SESSION', currentSession);

    return {
      data: {
        subscription: {
          unsubscribe() {
            authListeners.delete(callback);
          },
        },
      },
    };
  },
};

// Mock Supabase 객체
const mockSupabase = {
  auth: mockAuth,
  from(table: string) {
    return new MockQueryBuilder(table);
  },
};

// 최종 익스포트
export const supabase = isRealSupabase ? realSupabase : mockSupabase;
