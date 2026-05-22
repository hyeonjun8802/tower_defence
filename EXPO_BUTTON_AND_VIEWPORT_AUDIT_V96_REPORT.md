# v96 Expo 모바일 전투 버튼/화면 비율 전수검사 보고서

## 기준 버전
- 기준 파일: `v003_saved_v78_refactor_split_v88.zip`
- 목적: v88의 장판/드래그/전투 디자인은 유지하면서 Expo 모바일 WebView의 세로/가로 화면 비율과 전투 버튼 동작만 수정

## 확인한 원인
1. `소환 / 합치기 / 배속 / 정지` 실제 버튼은 `#combatHudCommands` 안으로 이동되어 있음.
2. 기존 v37 패치가 `#combatHudCommands`를 `left:-10000px`, `visibility:hidden`, `pointer-events:none`으로 숨김.
3. 화면에 보이는 버튼은 `hudProxyBtn` 프록시 버튼이었음.
4. Expo WebView에서는 프록시 버튼 위를 터치해도 hit-test가 canvas 또는 숨겨진 원본 컨테이너로 잡힐 수 있음.
5. 이때 document capture 단계의 v37 guard가 원본 버튼 터치를 `stale original command`로 판단하여 canvas 이벤트로 재전송함.
6. 결과적으로 원본 `summon()`, `autoMerge()`, 배속 토글 함수까지 도달하지 못함.

## v96 수정 방향
- 프록시 버튼/투명 hitbox 경로를 포기.
- 실제 원본 버튼을 다시 화면에 노출.
- window capture 단계에서 실제 버튼 좌표를 먼저 검사해서 v37 document capture보다 먼저 직접 명령 실행.
- DOM `click()` 재발행 대신 game-core 내부 명령 함수를 `window.PRD_GAME_COMMANDS_V96`로 export 후 직접 호출.
- Expo WebView는 `visualViewport` 기준으로 `--prd-vw`, `--prd-vh`를 갱신해 세로/가로 모드 화면을 고정.

## 검증 도구
브라우저 콘솔에서 아래 함수로 현재 버튼 상태를 확인할 수 있음.

```js
window.PRD_COMMAND_AUDIT_V96()
```

반환값에는 버튼별 존재 여부, display/visibility/pointer-events, 화면 좌표, onclick 연결 여부, combatActive 상태가 포함됨.

## 변경 파일
- `src/scripts/game-core.js`
- `src/scripts/patches.runtime.js`
- `EXPO_BUTTON_AND_VIEWPORT_AUDIT_V96_REPORT.md`
