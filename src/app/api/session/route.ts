// 파일경로: src/app/api/session/route.ts

import { NextResponse } from 'next/server';
import { INITIAL_DRILLS, SwimDrill, RoutineItem, SwimSession, StrokeType, FocusType } from '@/types/swim';

// 소요 분(fractional minutes)을 "M분 S초" 형식으로 포맷팅하는 헬퍼
function formatMinutesToMinSec(minutes: number): string {
  const mins = Math.floor(minutes);
  const secs = Math.round((minutes - mins) * 60);
  if (secs === 0) {
    return `${mins}분`;
  }
  return `${mins}분 ${secs}초`;
}

// 훈련 아이템 생성 헬퍼 함수
function generatePhaseItems(
  drills: SwimDrill[],
  targetMinutes: number
): { items: RoutineItem[]; actualMinutes: number } {
  if (drills.length === 0) {
    return { items: [], actualMinutes: 0 };
  }

  const itemsMap = new Map<string, RoutineItem>();
  let currentMinutes = 0;
  let index = 0;
  let safetyCounter = 0;

  // 라운드 로빈 방식으로 드릴을 하나씩 돌며 목표 시간에 가까워질 때까지 추가
  while (currentMinutes < targetMinutes && safetyCounter < 30) {
    const drill = drills[index % drills.length];
    // 1세트당 소요 시간 (분)
    const setDuration = (drill.defaultDistance / 100) * drill.estimatedMinutesPer100m;

    // 만약 추가하려는데 목표 시간을 크게 넘어서고 오차가 더 벌어진다면 추가 안 함 (최소 1개는 강제 입력)
    if (currentMinutes + setDuration > targetMinutes) {
      const errorBefore = targetMinutes - currentMinutes;
      const errorAfter = (currentMinutes + setDuration) - targetMinutes;
      if (itemsMap.size > 0 && errorAfter > errorBefore) {
        break;
      }
    }

    if (itemsMap.has(drill.id)) {
      const item = itemsMap.get(drill.id)!;
      item.reps += 1;
      item.distance += drill.defaultDistance;
      item.duration += setDuration;
    } else {
      itemsMap.set(drill.id, {
        drill,
        distance: drill.defaultDistance,
        duration: setDuration,
        reps: 1,
        targetPace: `${drill.defaultDistance}m당 약 ${formatMinutesToMinSec(setDuration)} (인터벌 기준)`,
      });
    }

    currentMinutes += setDuration;
    index++;
    safetyCounter++;
  }

  // Map의 값들을 배열로 변환하고 가독성을 위해 targetPace 최종 보정
  const items = Array.from(itemsMap.values()).map((item) => {
    const singleSetTime = (item.drill.defaultDistance / 100) * item.drill.estimatedMinutesPer100m;
    // 인터벌 타겟 페이스 계산 (1세트 수행 시간 + 휴식 시간 약 15~30초 고려)
    const restSeconds = item.drill.phase === 'warmup' ? 20 : item.drill.phase === 'cooldown' ? 15 : 30;
    const intervalMinutes = singleSetTime + (restSeconds / 60);
    
    return {
      ...item,
      targetPace: `${item.drill.defaultDistance}m 페이스: ${formatMinutesToMinSec(singleSetTime)} / 추천 인터벌: ${formatMinutesToMinSec(intervalMinutes)}`,
    };
  });

  return {
    items,
    actualMinutes: Number(currentMinutes.toFixed(1)),
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalMinutes, preferredStroke, preferredFocus, difficulty } = body;

    if (!totalMinutes || typeof totalMinutes !== 'number' || totalMinutes <= 0) {
      return NextResponse.json(
        { error: '올바른 운동 시간(분)을 입력해주세요. (예: 60)' },
        { status: 400 }
      );
    }

    // 시간 분배 (웜업 25%, 본운동 60%, 다운 15%)
    const warmupTarget = totalMinutes * 0.25;
    const mainTarget = totalMinutes * 0.60;
    const cooldownTarget = totalMinutes * 0.15;

    // 단계별 드릴 필터링 및 우선순위 정렬
    const filterAndSortDrills = (phase: 'warmup' | 'main' | 'cooldown'): SwimDrill[] => {
      // 1차: 해당 단계의 전체 드릴 필터
      let filtered = INITIAL_DRILLS.filter((d) => d.phase === phase);

      // 2차: 난이도 필터 (있을 경우에만 적용, 매칭되는 것이 없을 경우 전체 유지)
      if (difficulty) {
        const difficultyFiltered = filtered.filter((d) => d.difficulty === difficulty);
        if (difficultyFiltered.length > 0) {
          filtered = difficultyFiltered;
        }
      }

      // 3차: 선호 영법 및 선호 효과 가중치 적용 정렬
      // 선호 조건과 일치하는 드릴들을 배열 앞쪽으로 배치하여 루틴 생성 엔진이 먼저 선택하도록 함
      return [...filtered].sort((a, b) => {
        let scoreA = 0;
        let scoreB = 0;

        if (preferredStroke) {
          if (a.stroke === preferredStroke) scoreA += 5;
          else if (a.stroke === '공통') scoreA += 2;
          
          if (b.stroke === preferredStroke) scoreB += 5;
          else if (b.stroke === '공통') scoreB += 2;
        }

        if (preferredFocus) {
          if (a.focus === preferredFocus) scoreA += 3;
          if (b.focus === preferredFocus) scoreB += 3;
        }

        return scoreB - scoreA; // 점수가 높은 드릴이 앞으로 옴
      });
    };

    const warmupDrills = filterAndSortDrills('warmup');
    const mainDrills = filterAndSortDrills('main');
    const cooldownDrills = filterAndSortDrills('cooldown');

    // 세션 빌드
    const warmupResult = generatePhaseItems(warmupDrills, warmupTarget);
    const mainResult = generatePhaseItems(mainDrills, mainTarget);
    const cooldownResult = generatePhaseItems(cooldownDrills, cooldownTarget);

    const session: SwimSession = {
      totalMinutes,
      warmup: {
        targetMinutes: Number(warmupTarget.toFixed(1)),
        actualMinutes: warmupResult.actualMinutes,
        items: warmupResult.items,
      },
      main: {
        targetMinutes: Number(mainTarget.toFixed(1)),
        actualMinutes: mainResult.actualMinutes,
        items: mainResult.items,
      },
      cooldown: {
        targetMinutes: Number(cooldownTarget.toFixed(1)),
        actualMinutes: cooldownResult.actualMinutes,
        items: cooldownResult.items,
      },
    };

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json(
      { error: '서버 에러가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}
