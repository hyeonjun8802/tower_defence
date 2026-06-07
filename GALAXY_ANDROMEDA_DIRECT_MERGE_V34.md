# Galaxy / Andromeda Direct Merge v34

## 목적
- Root의 Milky Rift는 `v003_edit` 기존 코드 그대로 유지한다.
- Andromeda Trace는 기존에 정상 동작하던 Andromeda 코드 묶음을 `/andromeda/index.html`로 분리해서 직접 호출한다.
- Root 안에서 Andromeda 전투/스테이지맵을 비슷하게 재구현하지 않는다.

## 핵심 구조
- Root: `src/scripts/galaxy-andromeda-direct-bridge.v34.js`
  - 은하계 맵에서 Andromeda 선택/ENTER 클릭을 캡처한다.
  - 기존 `showStageMap()` 바인딩보다 먼저 `stopImmediatePropagation()`으로 Milky stage map 진입을 차단한다.
  - Andromeda 선택 시 `andromeda/index.html?campaign=andromeda`로 직접 이동한다.
  - Milky 선택 시에는 기존 `showStageMap()`을 그대로 호출한다.

- Andromeda: `andromeda/src/scripts/andromeda-direct-boot.v34.js`
  - Andromeda 페이지 진입 시 `ANDROMEDA TRACE` 스테이지맵을 바로 표시한다.
  - stage enter 전 `PRD_CAMPAIGN=andromeda`, `PRD_ANDROMEDA_BATTLE_ACTIVE=1` 상태를 유지한다.
  - 기존 Andromeda 내부 `game-core.js`, `patches.runtime.js`, `map-hud-recovery.v83.js`를 그대로 사용한다.

## 정리한 부분
- 이전 v33 연결 문서/스크립트 제거
- Andromeda 폴더는 v23 계열 기존 Andromeda 코드 묶음으로 교체
- 새로 만든 것은 연결/부트스트랩 최소 스크립트 2개뿐

## 유지
- Milky stage map / Milky battle route
- Andromeda stage map / Andromeda battle route
- Tower, reward, save, hidden planet, balance logic
