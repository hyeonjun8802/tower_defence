# Andromeda Route Color Rule v35

## 기준

- Milky Rift / 은하수 전투 길: blue / cyan 계열 유지
- Andromeda Trace / 안드로메다 전투 길: red / pink / magenta 계열로 고정

## 검토 결과

v34 구조는 캠페인을 분리했지만, Andromeda 전투 `game-core.js`의 `andromedaCombatPalette()` 초반 스테이지 기본값이 cyan 계열로 남아 있었습니다.
이 때문에 Andromeda 1~5 전투 길이 Milky 전투 길처럼 보일 수 있었습니다.

## 수정 내용

- Root Milky 전투 코드는 변경하지 않았습니다.
- `andromeda/src/scripts/game-core.js`의 Andromeda 전투 route palette만 수정했습니다.
- Andromeda 1~15 전 구간의 몬스터 길을 red / pink / magenta 계열로 유지합니다.
- Stage 15 최종 route도 기존 circular core route를 유지하면서 red/pink 계열로 표시합니다.
- route corner dot, route marker, dash guide도 blue/cyan 잔여색이 보이지 않도록 palette 기반으로 통일했습니다.

## 유지한 것

- Milky stage map / Milky battle route
- Andromeda stage map / Andromeda route geometry
- 전투 밸런스
- 타워/몬스터/저장/해금 로직
