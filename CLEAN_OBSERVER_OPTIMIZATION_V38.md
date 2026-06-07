# V38 Clean Observer Optimization

## 목표

전투 화면의 전투 로직, 캔버스, 커맨드 버튼 동작은 건드리지 않고, 메뉴/갤럭시맵/스테이지맵/강화팝업에서 난발하던 옵저버와 반복 동기화 구조를 중앙 스케줄러 방식으로 정리했다.

## 핵심 변경

- `src/scripts/clean-runtime.v38.js` 추가
- `andromeda/src/scripts/clean-runtime.v38.js` 추가
- `index.html`, `andromeda/index.html`에서 `game-core.js`보다 먼저 clean runtime 로드
- 스테이지맵 상태 감시를 `observeStageMapState()`로 통합
- 화면 표시 상태 감시를 `observeScreenState()`로 통합
- 강화 상세 패널 childList 감시를 `observeArmoryDetail()`로 통합
- 메뉴 버튼 재바인딩 polling 제거
- 안드로메다 맵 비주얼 경로 재계산 polling 제거
- 강화 지갑 observer 부착용 retry interval 제거

## 의도적으로 건드리지 않은 영역

- 전투 루프
- 전투 캔버스 좌표/배치 계산
- 소환/합치기/배속/정지 커맨드 직접 처리
- BGM/전투 HUD 복구용 기존 전투 관련 안정화 루틴
- 밸런스 JSON 및 이미지/오디오 리소스

## 검증

- `src/scripts/*.js` 문법 검사 통과
- `andromeda/src/scripts/*.js` 문법 검사 통과
- ZIP 무결성 검사 통과

## 주의

브라우저 렌더링 캡처 비교는 이 실행 환경에서 수행하지 않았다. 변경은 이벤트/옵저버 구조 정리에 한정했고, 시각 디자인 수치와 전투 로직은 변경하지 않았다.
