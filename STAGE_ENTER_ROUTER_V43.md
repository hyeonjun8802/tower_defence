# V43 Stage ENTER Router Fix

## 증상
가로모드 `CONSTELLATION MAP`에서 하단 `ENTER` 버튼을 누르면 하단 버튼 도크가 사라지고, 전투 화면으로 정상 진입하지 않는 현상이 발생했다.

## 원인
기존 v274/v83 가로모드 하단 도크 핸들러가 `prd-stage-entering` 상태를 먼저 켠 뒤, 실제 전투 초기화 함수가 실행되기 전에 이벤트 흐름이 다른 캡처 핸들러와 충돌할 수 있었다.

그 결과 CSS의 `body.prd-stage-entering #v274StageActionDock` 규칙 때문에 하단 버튼은 숨겨지지만, `#stageMap`은 아직 display:block 상태로 남아 전투 화면이 보이지 않는 상태가 만들어졌다.

## 수정
`stage-enter-router.v43.js`를 추가했다.

- `window capture` 단계에서 `#stageEnterBtn`, `#v274StageEnterBtn`, `#v274MapInfoEnterBtn` 클릭을 먼저 처리
- 기존 document capture 핸들러보다 먼저 실행하여 중복/충돌 차단
- 실제 전투 초기화는 `window.PRD_BATTLE.startSelectedStageFromMap()`을 우선 사용
- 전투 화면이 실제로 mount되지 않으면 `prd-stage-entering` 상태를 즉시 rollback하고 하단 도크를 복구
- 옵저버/interval 추가 없음
- 전투 루프, 밸런스, 소환/합치기/배속/정지 로직 변경 없음

## 적용 파일
- `src/scripts/stage-enter-router.v43.js`
- `andromeda/src/scripts/stage-enter-router.v43.js`
- `index.html`
- `andromeda/index.html`
