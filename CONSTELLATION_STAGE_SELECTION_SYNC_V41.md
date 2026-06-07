# CONSTELLATION STAGE SELECTION SYNC V41

## 수정 목적

은하수 `CONSTELLATION MAP`에서 스테이지 행성을 눌러도 가로모드 하단 `ENTER` 버튼과 상단 선택 문구가 즉시 바뀌지 않는 문제를 수정했습니다.

## 원인

기존 `game-core.js`의 스테이지 클릭 핸들러가 `document` capture 단계에서 `stopImmediatePropagation()`을 호출합니다.
이 때문에 뒤쪽에 로드된 가로모드 하단 도크 동기화 로직이 같은 클릭 이벤트를 받지 못했습니다.

결과적으로 실제 스테이지 선택 처리와 하단 `#v274StageEnterBtn` 텍스트 갱신 타이밍이 어긋났습니다.

## 수정 내용

- `src/scripts/constellation-stage-selection-sync.v41.js` 신규 추가
- `index.html`에 위 스크립트 로드 추가
- `window` capture 단계에서 스테이지 선택을 먼저 읽고 즉시 UI를 동기화
- 동기화 대상
  - `#stageMap[data-selected]`
  - `.stageNode.active / unlocked / locked`
  - `#stageProgressLabel`
  - `#stageProgressSub`
  - `#stageHint`
  - `#stageEnterBtn`
  - `#v274StageEnterBtn`
  - 정보 팝업의 `#v274MapInfoEnterBtn`
  - `#stageInfoPanel`
  - `#offlineStagePanel`
- route/svg 레이어 위 클릭도 보정할 수 있도록 가까운 스테이지 노드 계산 fallback 포함

## 제한 범위

- 전투 화면은 변경하지 않았습니다.
- 전투 루프, 밸런스, 소환/합치기/배속/정지 로직은 변경하지 않았습니다.
- MutationObserver나 setInterval을 새로 추가하지 않았습니다.

## 검증

- `src/scripts/*.js` 문법 검사 통과
- `andromeda/src/scripts/*.js` 문법 검사 통과
- ZIP 무결성 검사 통과
