# UI Event Flow & Test Mode Cleanup V44

## 수정 목적
- 스테이지 행성 클릭 시 일반 모드인데도 `TEST MODE` 문구가 붙는 문제 수정
- v40/v41/v42/v43처럼 기능별로 분산된 동기화 스크립트가 서로 이벤트 순서를 경쟁하는 구조 정리
- ENTER 버튼 클릭 시 하단 버튼만 사라지고 전투 진입이 누락되는 race condition 방지

## 핵심 원인
기존 일부 패치가 `localStorage.PLANET_RIFT_TEST_MODE` 또는 저장된 `META.flags.testMode`를 테스트 모드 판정에 사용했습니다. 한 번 테스트 모드에 들어간 브라우저에서는 일반 시작으로 들어와도 이 값이 남아, 스테이지 행성 클릭 동기화 시 `TEST MODE` 라벨이 다시 살아날 수 있었습니다.

## 반영 내용
- `stage-map-controller.v44.js` 추가
  - 은하수/안드로메다 공통 스테이지 선택/ENTER 라우터
  - MutationObserver/setInterval 없이 이벤트 기반으로만 동작
  - 테스트 모드는 `TEST MODE` 버튼 또는 `?test=1` 진입일 때만 활성화
  - 일반 시작 시 오래된 테스트 플래그를 local/session storage와 META flags에서 정리
- `game-core.js` / `andromeda/src/scripts/game-core.js`
  - `PRD_STAGE_RUNTIME` 브리지 추가
  - 외부 UI 컨트롤러가 closure 내부 `StageMapState`를 안전하게 갱신 가능
  - 테스트 모드 저장은 session 기준으로만 유지하고 일반 모드 진입 시 localStorage 잔여값 제거
- `index.html` / `andromeda/index.html`
  - v40/v41/v42/v43 분산 동기화 스크립트 로드 제거
  - v44 단일 컨트롤러만 로드
- `galaxy-andromeda-direct-bridge.v37.js`, `andromeda-direct-boot.v34.js`, `galaxy-map-controller.v23.js`
  - stale localStorage 기반 테스트 판정 제거
  - 명시적 테스트 진입 신호만 사용

## 변경 제외
- 전투 루프
- 타워/몬스터 밸런스
- 소환/합치기/배속/정지 버튼 로직
- 오디오/이미지 리소스
