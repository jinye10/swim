# 🌊 물결 (Mulgyeol) - 수영 훈련 최적화 서비스

'물결(Mulgyeol)'은 개인의 수영 목표 시간에 부합하도록 **웜업(25%) - 본운동(60%) - 정리운동(15%)** 비율을 자동으로 배분하고, 개인 맞춤 영법별/효과별 수영 드릴 세트 루틴을 설계해 주는 수영 훈련 최적화 플랫폼입니다.

이 프로젝트는 **Next.js App Router**, **TypeScript**, **Tailwind CSS**, **Supabase**를 활용하여 설계되었으며, Vercel 서버리스 런타임에 즉시 배포하여 서비스할 수 있도록 구성되어 있습니다.

---

## 🚀 학생을 위한 3단계 연동 & 배포 가이드

본 저장소를 포크(Fork)하여 개인 Supabase 데이터베이스와 Vercel 호스팅에 연동하여 직접 서비스하는 과정입니다.

---

### [Step 1] GitHub Fork 및 로컬 확인
1. 본 GitHub 저장소 우측 상단의 **Fork** 버튼을 눌러 본인 계정으로 프로젝트를 가져옵니다.
2. 포크한 본인의 저장소를 로컬 컴퓨터에 복제(Clone)합니다:
   ```bash
   git clone https://github.com/본인_계정/swim.git
   cd swim
   ```
3. 의존성 패키지를 설치합니다:
   ```bash
   npm install
   ```
4. 프로젝트 루트 경로에 `.env.local` 파일을 생성하고, 본인의 Supabase API Key 정보를 기입합니다 (Step 2에서 획득):
   * `.env.example` 파일을 복사하여 `.env.local`로 이름을 바꾼 뒤 작성하셔도 됩니다.
5. 로컬 개발 서버를 가동합니다:
   ```bash
   npm run dev
   ```
   * **Tip**: 환경변수가 설정되지 않은 경우에도 로컬 가상 스토리지(Mock DB/Auth)를 통해 모든 회원가입, 로그인, 루틴 피드백, 공유 게시판 기능이 오프라인 로컬 테스트 모드로 완벽하게 동작하므로 즉시 기능을 확인해 보실 수 있습니다.

---

### [Step 2] Supabase 데이터베이스 및 회원(Auth) 설정
1. [Supabase](https://supabase.com)에 가입 후 신규 프로젝트(Project)를 생성합니다.
2. 생성된 프로젝트의 **SQL Editor** 메뉴로 이동하여 **"New Query"**를 누르고 아래의 SQL 스크립트를 전체 복사해 실행하여 데이터베이스 테이블을 구축하고 초기 수영 드릴 데이터를 삽입합니다.

#### 1) 데이터베이스 테이블 구축 SQL
```sql
-- 1. 드릴 라이브러리 테이블 생성
CREATE TABLE public.drills (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    stroke TEXT NOT NULL,
    focus TEXT NOT NULL,
    phase TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    intensity INTEGER NOT NULL,
    estimated_minutes_per_100m NUMERIC NOT NULL,
    default_distance INTEGER NOT NULL,
    youtube_url TEXT
);

-- 2. 운동 피드백 로그 테이블 생성
CREATE TABLE public.feedback_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    total_minutes INTEGER NOT NULL,
    satisfaction INTEGER NOT NULL,
    difficulty_rating TEXT NOT NULL,
    session_summary TEXT NOT NULL,
    memo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 유튜브 공유판 테이블 생성
CREATE TABLE public.shared_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    title TEXT NOT NULL,
    youtube_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

#### 2) 초기 수영 드릴 씨드 데이터 삽입 SQL
```sql
INSERT INTO public.drills (id, name, description, stroke, focus, phase, difficulty, intensity, estimated_minutes_per_100m, default_distance, youtube_url) VALUES
('w1', '한 팔 자유형 롤링 (Single-Arm Freestyle)', '한 손은 앞으로 뻗고 다른 한 손으로만 스트로크하며 어깨 회전과 몸의 롤링 타이밍을 잡는 웜업 드릴입니다.', '자유형', '자세/테크닉', 'warmup', '초급', 2, 3.0, 100, 'https://www.youtube.com/watch?v=P2f_yQj5Dsg'),
('w2', '배영 킥보드 품고 발차기 (Backstroke Kick with Board)', '어깨 긴장을 풀고 가슴 위에 킥보드를 안은 채 누워 배영 발차기를 하여 하체와 엉덩이를 띄우는 감각을 익힙니다.', '배영', '웜업', 'warmup', '초급', 2, 3.5, 100, 'https://www.youtube.com/watch?v=S0Yg9CihdD8'),
('w3', '캐치업 자유형 (Catch-up Freestyle)', '양손이 머리 앞에서 만난 후 번갈아 스트로크를 시작하는 드릴로, 글라이딩과 캐치 구간의 물감각을 서서히 깨워줍니다.', '자유형', '자세/테크닉', 'warmup', '중급', 2, 2.8, 200, 'https://www.youtube.com/watch?v=S28dZ7gGjXo'),
('w4', '개인혼영 메들리 웜업 (IM Medley Warmup)', '접영, 배영, 평영, 자유형을 순서대로 짧게 왕복하며 전신 근육과 관절을 활성화시키는 웜업 루틴입니다.', '혼영', '웜업', 'warmup', '중급', 3, 2.5, 200, 'https://www.youtube.com/watch?v=680w9lP2XqA'),
('m1', '자유형 주먹 쥐고 수영 (Fist Freestyle)', '손바닥을 쥔 채 스트로크하여 손 대신 아래팔(전완) 전체로 물을 밀어내는 ‘하이 엘보 캐치’ 감각을 기르는 테크닉 드릴입니다.', '자유형', '자세/테크닉', 'main', '중급', 3, 2.5, 100, 'https://www.youtube.com/watch?v=K3S1K4W68H8'),
('m2', '평영 투 킥 원 풀 (2 Kicks 1 Pull Breaststroke)', '한 번의 스트로크 후 발차기를 두 번 연속으로 차서 평영 고유의 글라이딩 시간과 유선형(Streamline) 자세를 극대화하는 드릴입니다.', '평영', '지구력', 'main', '중급', 4, 2.8, 200, 'https://www.youtube.com/watch?v=mDmg4L_j0pQ'),
('m3', '접영 한 팔 드릴 (Single-Arm Butterfly)', '한 팔은 고정하고 한 팔로 스트로크하며 물속 입수 시점과 출수킥의 리듬 타이밍을 완벽하게 맞추는 연습을 합니다.', '접영', '자세/테크닉', 'main', '초급', 3, 3.2, 100, 'https://www.youtube.com/watch?v=jW8m36M3w2k'),
('m4', '자유형 피라미드 빌드업 (Freestyle Pyramid Build-up)', '거리를 늘렸다가 다시 줄이면서 페이스를 서서히 끌어올리는 심폐지구력 및 페이스 조절 훈련입니다.', '자유형', '지구력', 'main', '상급', 5, 2.0, 400, 'https://www.youtube.com/watch?v=r_A7v8hZp0c'),
('m5', '배영 롤링 & 숄더 드라이브 (Backstroke Shoulder Drive)', '어깨를 크게 롤링하며 턱과 뺨이 어깨에 스치도록 유도해, 배영의 추진력과 비대칭 스트로크 편차를 줄입니다.', '배영', '자세/테크닉', 'main', '중급', 3, 2.6, 200, 'https://www.youtube.com/watch?v=T_8N_O1M8N8'),
('m6', '무호흡 대시 드릴 (Hypoxic Swim)', '스트로크당 호흡 횟수를 5회, 7회 등으로 제한하여 무산소 지구력 및 폐활량을 극대화하는 하드 트레이닝 드릴입니다.', '자유형', '호흡', 'main', '상급', 5, 2.2, 100, 'https://www.youtube.com/watch?v=z8Xy4Yw3G1Q'),
('c1', '자유형 이지 스윔 (Easy Freestyle)', '최대한 힘을 빼고 긴 글라이딩을 느끼며, 젖산 제거와 심박수 회복을 목표로 가볍게 수영합니다.', '자유형', '정리', 'cooldown', '초급', 1, 2.5, 100, 'https://www.youtube.com/watch?v=8q-pS7gX3D8'),
('c2', '배영 이중 리커버리 (Double-Arm Backstroke Easy)', '양팔을 동시에 크게 머리 뒤로 넘기며 가슴과 어깨 관절을 편안하게 이완하고 배영 킥으로 물을 흘려보냅니다.', '배영', '정리', 'cooldown', '초급', 1, 3.2, 100, 'https://www.youtube.com/watch?v=9L8W4Yd7H3w'),
('c3', '미들 스컬링 (Middle Sculling)', '몸을 엎드린 채 양손으로 8자 모양을 그리며 양력을 만들어 앞으로 천천히 나아가며 손끝의 물 감각을 유지합니다.', '공통', '자세/테크닉', 'cooldown', '중급', 2, 4.0, 50, 'https://www.youtube.com/watch?v=S0Yg9CihdD8');
```

#### 3) Supabase 회원 이메일 인증 비활성화 설정 (선택/테스트 편의용)
*   사용자 가입 시 가짜 이메일 주소로도 바로 가입하고 즉시 로그인할 수 있도록 컨펌 메일 인증을 비활성화하는 것을 권장합니다.
*   **설정 경로**: Supabase 대시보드 &rarr; **Authentication** &rarr; **Providers** &rarr; **Email** 항목을 누르고, **"Confirm email"** 옵션을 **비활성화(OFF)** 한 후 저장합니다.

#### 4) API 키 확인
*   Supabase 프로젝트의 **Project Settings &rarr; API** 메뉴에서 다음 값을 찾아 로컬 `.env.local` 파일 또는 Vercel 환경 변수에 입력합니다:
    *   **Project URL** &rarr; `NEXT_PUBLIC_SUPABASE_URL`에 주입
    *   **Project API anon key** &rarr; `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 주입

---

### [Step 3] Vercel 배포 및 환경 변수 등록
1. [Vercel](https://vercel.com)에 로그인(또는 가입)합니다.
2. **"Add New" &rarr; "Project"**를 클릭하여 포크해 둔 본인의 GitHub 저장소(`swim`)를 불러옵니다.
3. 프로젝트 설정 화면에서 **Environment Variables (환경 변수)** 탭을 확장하고 아래 두 쌍을 입력합니다:
   * **Key**: `NEXT_PUBLIC_SUPABASE_URL` / **Value**: `본인의 Supabase 프로젝트 URL`
   * **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY` / **Value**: `본인의 Supabase Anon Key`
4. **Deploy** 버튼을 누르면 배포 빌드가 실행되며, 1~2분 안에 전 세계 누구나 사용할 수 있는 서비스 URL이 발급됩니다.

---

## 🛠️ 주요 기능 소개

*   **대시보드 (Dashboard)**: 사용자가 원하는 목표 수영 시간을 입력하여 세션을 맞춤 생성합니다. 더불어 자신이 완료한 훈련에 만족도(1~5점)와 메모 피드백을 기록하여 개인별 이력을 누적할 수 있습니다.
*   **드릴 라이브러리 (Drills Library)**: 영법(자유형, 배영, 평영, 접영, 개인혼영) 및 목적에 맞춰 전문 수영 드릴을 카드로 조회하고 최대 4개까지 담아 한눈에 비교할 수 있습니다. 각 카드 하단의 "유튜브 시청"을 누르면 가이드 영상이 인앱 팝업 플레이어로 즉시 제공됩니다.
*   **루틴 시각화 (Routine Generator)**: 생성된 루틴을 시간 순서대로 웜업, 본운동, 다운 타임라인 카드로 시각화해 줍니다. 세트수와 권장 페이스, 휴식 인터벌이 동적으로 계산됩니다.
*   **유튜브 영상 공유판 (Video Sharing Board)**: 로그인한 회원들이 연습에 유용한 유튜브 영상을 제목, 주소, 설명과 함께 올려 다 함께 공유하고 인앱 플레이어로 시청할 수 있는 커뮤니티 공간입니다.
*   **통합 관리자 콘솔 (Admin Console)**: `admin@mulgyeol.com` 계정으로 로그인하거나, 로컬 Mock 우회 모드 진입 시 관리자 권한을 획득합니다. 서비스 가입 회원 현황을 확인하고, 드릴 라이브러리 전체의 유튜브 영상 안내 링크를 실시간 수정하고 반영할 수 있습니다.
