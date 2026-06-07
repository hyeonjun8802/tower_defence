# Andromeda Stage 15 Wide Core Spiral v14

## 목적
Stage 15 전투 화면에서 중앙 코어는 적용되었지만, 몬스터 길의 중앙 원/소용돌이 반경이 작아 보여 최종 보스 스테이지의 스케일감이 부족했다.

## 변경 내용
- Stage 15 전용 monster route를 `final-spiral-center-wide`로 교체.
- 외곽 큰 링 → 중간 링 → 내부 링 → 중앙 CORE로 들어가는 넓은 소용돌이 구조 적용.
- 중앙 CORE 시각 크기 확대.
  - 외곽 링, 점선 코어 링, pulse 효과 추가.
  - 실제 은하수/legacy core 위치와 route는 변경하지 않음.
- Stage 15 배치 가능 섬을 넓어진 소용돌이 사이 공간 기준으로 재배치.
- 기존 은하수 route, 1~14 안드로메다 route, 밸런스/보상/저장/타워 로직은 변경하지 않음.

## 적용 범위
- Andromeda Stage 15 only.
