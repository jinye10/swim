// 파일경로: src/types/swim.ts

export type StrokeType = '자유형' | '배영' | '평영' | '접영' | '혼영' | '공통';
export type FocusType = '자세/테크닉' | '지구력' | '스피드' | '호흡' | '웜업' | '정리';
export type PhaseType = 'warmup' | 'main' | 'cooldown';

export interface SwimDrill {
  id: string;
  name: string;
  description: string;
  stroke: StrokeType;
  focus: FocusType;
  phase: PhaseType;
  difficulty: '초급' | '중급' | '상급';
  intensity: number; // 1 (낮음) ~ 5 (높음)
  estimatedMinutesPer100m: number; // 100m 기준 예상 소요 시간 (분)
  defaultDistance: number; // 추천 1세트 기본 거리 (m)
  youtubeUrl?: string;
}

export interface RoutineItem {
  drill: SwimDrill;
  distance: number; // 할당된 총 거리 (m)
  duration: number; // 할당된 총 시간 (분)
  reps: number; // 세트 반복 횟수 (예: 50m x 4회)
  targetPace: string; // 추천 페이스 가이드
}

export interface SwimSession {
  totalMinutes: number;
  warmup: {
    targetMinutes: number;
    actualMinutes: number;
    items: RoutineItem[];
  };
  main: {
    targetMinutes: number;
    actualMinutes: number;
    items: RoutineItem[];
  };
  cooldown: {
    targetMinutes: number;
    actualMinutes: number;
    items: RoutineItem[];
  };
}

export interface FeedbackLog {
  id: string;
  date: string;
  totalMinutes: number;
  satisfaction: number; // 1 ~ 5
  difficultyRating: '너무 쉬움' | '적당함' | '너무 힘들었음';
  memo: string;
  sessionSummary: string;
}

export const INITIAL_DRILLS: SwimDrill[] = [
  // WARM-UP DRILLS
  {
    id: 'w1',
    name: '한 팔 자유형 롤링 (Single-Arm Freestyle)',
    description: '한 손은 앞으로 뻗고 다른 한 손으로만 스트로크하며 어깨 회전과 몸의 롤링 타이밍을 잡는 웜업 드릴입니다.',
    stroke: '자유형',
    focus: '자세/테크닉',
    phase: 'warmup',
    difficulty: '초급',
    intensity: 2,
    estimatedMinutesPer100m: 3.0,
    defaultDistance: 100,
  },
  {
    id: 'w2',
    name: '배영 킥보드 품고 발차기 (Backstroke Kick with Board)',
    description: '어깨 긴장을 풀고 가슴 위에 킥보드를 안은 채 누워 배영 발차기를 하여 하체와 엉덩이를 띄우는 감각을 익힙니다.',
    stroke: '배영',
    focus: '웜업',
    phase: 'warmup',
    difficulty: '초급',
    intensity: 2,
    estimatedMinutesPer100m: 3.5,
    defaultDistance: 100,
  },
  {
    id: 'w3',
    name: '캐치업 자유형 (Catch-up Freestyle)',
    description: '양손이 머리 앞에서 만난 후 번갈아 스트로크를 시작하는 드릴로, 글라이딩과 캐치 구간의 물감각을 서서히 깨워줍니다.',
    stroke: '자유형',
    focus: '자세/테크닉',
    phase: 'warmup',
    difficulty: '중급',
    intensity: 2,
    estimatedMinutesPer100m: 2.8,
    defaultDistance: 200,
  },
  {
    id: 'w4',
    name: '개인혼영 메들리 웜업 (IM Medley Warmup)',
    description: '접영, 배영, 평영, 자유형을 순서대로 짧게 왕복하며 전신 근육과 관절을 활성화시키는 웜업 루틴입니다.',
    stroke: '혼영',
    focus: '웜업',
    phase: 'warmup',
    difficulty: '중급',
    intensity: 3,
    estimatedMinutesPer100m: 2.5,
    defaultDistance: 200,
  },

  // MAIN SET DRILLS
  {
    id: 'm1',
    name: '자유형 주먹 쥐고 수영 (Fist Freestyle)',
    description: '손바닥을 쥔 채 스트로크하여 손 대신 아래팔(전완) 전체로 물을 밀어내는 ‘하이 엘보 캐치’ 감각을 기르는 테크닉 드릴입니다.',
    stroke: '자유형',
    focus: '자세/테크닉',
    phase: 'main',
    difficulty: '중급',
    intensity: 3,
    estimatedMinutesPer100m: 2.5,
    defaultDistance: 100,
  },
  {
    id: 'm2',
    name: '평영 투 킥 원 풀 (2 Kicks 1 Pull Breaststroke)',
    description: '한 번의 스트로크 후 발차기를 두 번 연속으로 차서 평영 고유의 글라이딩 시간과 유선형(Streamline) 자세를 극대화하는 드릴입니다.',
    stroke: '평영',
    focus: '지구력',
    phase: 'main',
    difficulty: '중급',
    intensity: 4,
    estimatedMinutesPer100m: 2.8,
    defaultDistance: 200,
  },
  {
    id: 'm3',
    name: '접영 한 팔 드릴 (Single-Arm Butterfly)',
    description: '한 팔은 고정하고 한 팔로 스트로크하며 물속 입수 시점과 출수킥의 리듬 타이밍을 완벽하게 맞추는 연습을 합니다.',
    stroke: '접영',
    focus: '자세/테크닉',
    phase: 'main',
    difficulty: '초급',
    intensity: 3,
    estimatedMinutesPer100m: 3.2,
    defaultDistance: 100,
  },
  {
    id: 'm4',
    name: '자유형 피라미드 빌드업 (Freestyle Pyramid Build-up)',
    description: '거리를 늘렸다가 다시 줄이면서 페이스를 서서히 끌어올리는 심폐지구력 및 페이스 조절 훈련입니다.',
    stroke: '자유형',
    focus: '지구력',
    phase: 'main',
    difficulty: '상급',
    intensity: 5,
    estimatedMinutesPer100m: 2.0,
    defaultDistance: 400,
  },
  {
    id: 'm5',
    name: '배영 롤링 & 숄더 드라이브 (Backstroke Shoulder Drive)',
    description: '어깨를 크게 롤링하며 턱과 뺨이 어깨에 스치도록 유도해, 배영의 추진력과 비대칭 스트로크 편차를 줄입니다.',
    stroke: '배영',
    focus: '자세/테크닉',
    phase: 'main',
    difficulty: '중급',
    intensity: 3,
    estimatedMinutesPer100m: 2.6,
    defaultDistance: 200,
  },
  {
    id: 'm6',
    name: '무호흡 대시 드릴 (Hypoxic Swim)',
    description: '스트로크당 호흡 횟수를 5회, 7회 등으로 제한하여 무산소 지구력 및 폐활량을 극대화하는 하드 트레이닝 드릴입니다.',
    stroke: '자유형',
    focus: '호흡',
    phase: 'main',
    difficulty: '상급',
    intensity: 5,
    estimatedMinutesPer100m: 2.2,
    defaultDistance: 100,
  },

  // COOL-DOWN DRILLS
  {
    id: 'c1',
    name: '자유형 이지 스윔 (Easy Freestyle)',
    description: '최대한 힘을 빼고 긴 글라이딩을 느끼며, 젖산 제거와 심박수 회복을 목표로 가볍게 수영합니다.',
    stroke: '자유형',
    focus: '정리',
    phase: 'cooldown',
    difficulty: '초급',
    intensity: 1,
    estimatedMinutesPer100m: 2.5,
    defaultDistance: 100,
  },
  {
    id: 'c2',
    name: '배영 이중 리커버리 (Double-Arm Backstroke Easy)',
    description: '양팔을 동시에 크게 머리 뒤로 넘기며 가슴과 어깨 관절을 편안하게 이완하고 배영 킥으로 물을 흘려보냅니다.',
    stroke: '배영',
    focus: '정리',
    phase: 'cooldown',
    difficulty: '초급',
    intensity: 1,
    estimatedMinutesPer100m: 3.2,
    defaultDistance: 100,
  },
  {
    id: 'c3',
    name: '미들 스컬링 (Middle Sculling)',
    description: '몸을 엎드린 채 양손으로 8자 모양을 그리며 양력을 만들어 앞으로 천천히 나아가며 손끝의 물 감각을 유지합니다.',
    stroke: '공통',
    focus: '자세/테크닉',
    phase: 'cooldown',
    difficulty: '중급',
    intensity: 2,
    estimatedMinutesPer100m: 4.0,
    defaultDistance: 50,
  },
];
