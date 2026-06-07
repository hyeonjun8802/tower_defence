# Command UI Visibility Restore v101

## 문제

전투 진입 후 `#combatHudCommands` 안의 실제 게임 버튼(`소환`, `합치기`, `1x`, `정지`)이 DOM에는 존재하지만 화면에 보이지 않는 문제가 발생했습니다.

## 원인

v46 UI 이벤트 플로우 리팩터 이후 전투 화면 전환은 정상 동작했지만, 이전 런타임 패치(v37)의 숨김 hitbox CSS가 일부 남아 실제 버튼에 다음 계열 속성을 계속 강제했습니다.

- `visibility: hidden`
- `opacity: 0`
- `pointer-events: none`
- `z-index: -1`
- `max-width: 1px`
- `max-height: 1px`
- `clip-path: inset(50%)`

즉, 게임 로직이나 전투 시작 문제가 아니라 전투 커맨드 버튼 CSS 복구 우선순위 문제였습니다.

## 수정 파일

- `src/scripts/patches.runtime.js`
- `andromeda/src/scripts/patches.runtime.js`

## 수정 내용

`v101-command-ui-visibility-restore` 패치를 추가했습니다.

- 전투 화면(`body.prd-combat-ui-active:not(.prd-map-ui-active)`)에서만 작동
- `#combatHudCommands`를 `#field` 직하위로 복구
- `.battleActions`와 실제 버튼 4개를 전투 화면에서 강제로 표시
- 기존 v37 숨김 속성(`visibility`, `opacity`, `pointer-events`, `z-index`, `max-width`, `clip-path`) 해제
- 맵/메뉴 화면에서는 기존처럼 커맨드 버튼 숨김 유지
- 루트 은하수와 안드로메다 런타임에 동일 적용

## 검증

- `node --check src/scripts/patches.runtime.js` 통과
- `node --check andromeda/src/scripts/patches.runtime.js` 통과
- 루트 전투 화면 검증
  - 모바일 세로 390x844: 버튼 4개 모두 `visible / flex / pointer-events:auto`
  - 모바일 가로 844x390: 버튼 4개 모두 `visible / flex / pointer-events:auto`
  - 데스크톱 1280x800: 버튼 4개 모두 `visible / flex / pointer-events:auto`
- 안드로메다 Stage 15 전투 화면 검증
  - 버튼 4개 모두 `visible / flex / pointer-events:auto`

## 비수정 영역

다음 영역은 수정하지 않았습니다.

- 전투 밸런스
- 몬스터/웨이브 로직
- 타워 공격 로직
- 오디오
- 이미지 리소스
- 스테이지 데이터
- v46 이벤트 플로우 자체
