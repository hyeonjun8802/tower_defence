# ANDROMEDA STAGE SELECTION SYNC V40

## 원인

안드로메다 스테이지맵의 행성 선택은 `game-core.js` 내부 캡처 단계 핸들러에서 `stopImmediatePropagation()`으로 처리됩니다. 이 때문에 뒤쪽에 붙은 가로모드 하단 도크(`v274StageEnterBtn`)와 설명 패널 동기화 패치가 같은 클릭 이벤트를 받지 못하거나, `data-selected` 변경 후 debounce observer를 기다려야 했습니다. 결과적으로 원본 `stageEnterBtn`, 하단 도크 버튼, 상단 설명 문구가 서로 다른 스테이지를 가리킬 수 있었습니다.

## 수정

- 전투 화면/전투 루프 변경 없음
- 신규 옵저버/interval 추가 없음
- `window` capture 단계에서 행성 선택 이벤트를 먼저 읽어 선택 스테이지를 즉시 동기화
- `StageMapState.selected`, `#stageMap[data-selected]`, 행성 active class, 원본 ENTER 버튼, 가로모드 하단 ENTER 버튼, 상단 설명 문구를 한 번에 갱신
- 기존 레거시 핸들러가 같은 스테이지로 후속 처리해도 최종 UI가 다시 맞도록 0/48/160ms 재동기화만 수행

## 수정 파일

- `andromeda/index.html`
- `andromeda/src/scripts/andromeda-stage-selection-sync.v40.js`
