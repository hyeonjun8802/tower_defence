# V141 Stage Manifest Progress Fix

- 성역 클리어 시 `StageMapState.unlocked`를 즉시 다음 성역으로 저장하도록 보강했습니다.
- `META.clears`, `StageMapState`, `META.unlockedTowers`가 서로 어긋나도 `STAGE_UNLOCK_MANIFEST` 기준으로 다시 동기화합니다.
- 1성역 클리어 후 2성역이 열리고, 1성역 보상 행성이 소환/강화 관리에 추가되도록 수정했습니다.
- 기존 저장 데이터에서 스테이지 진행값만 남아 있거나 클리어 메타만 남아 있어도 둘 중 더 많이 진행된 값을 우선합니다.
