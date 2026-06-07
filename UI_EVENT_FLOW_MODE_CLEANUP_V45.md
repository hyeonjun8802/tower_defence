# UI Event Flow / Mode Cleanup v45

## 목표
- 모드 선택부터 갤럭시맵, 스테이지맵, ENTER 전투 진입까지 순차 검토.
- START DEFENSE 일반 진입에서 과거 TEST MODE 저장값이 재활성화되는 문제 제거.
- 동일 기능을 여러 스크립트가 동시에 처리하면서 발생하던 event-flow race condition 축소.
- 전투 루프, 밸런스, 오디오, 소환/합치기/배속/정지 로직은 변경하지 않음.

## 확인된 핵심 원인
1. TEST MODE가 런타임 상태가 아니라 저장 데이터 `META.flags.testMode`에 남을 수 있었음.
2. 일반 START 진입 시 `setTestModeEnabled(false)`가 먼저 실행되어도, 이후 `loadOfflineMeta()`가 저장된 `META.flags.testMode=true`를 다시 불러오면 일부 패치가 TEST MODE로 판단할 수 있었음.
3. `patches.runtime.js` 안에는 과거 START/TEST/맵 이동 핸들러가 여러 개 남아 있어, 뒤늦게 추가한 컨트롤러가 먼저 실행되지 못하는 경우가 있었음.

## 수정 내용
### 1. TEST MODE 저장 정책 정리
- `normalizeOfflineMeta()`에서 저장된 `flags.testMode`를 항상 `false`로 정규화.
- `saveOfflineMeta()`에서 저장 직전 `META.flags.testMode=false` 강제.
- TEST MODE는 저장 상태가 아니라 현재 진입 플로우에서만 활성화.

### 2. 단일 앱 플로우 컨트롤러 적용
- `stage-map-controller.v45.js` 추가.
- START/TEST 버튼 capture 처리, 스테이지 선택, 스테이지 ENTER 라우팅을 하나의 컨트롤러에서 관리.
- `game-core.js` 바로 다음에 로드하여 기존 legacy patch보다 먼저 이벤트를 잡도록 변경.

### 3. 오래된 분산 컨트롤러 제거
- `stage-map-controller.v44.js` 제거.
- `andromeda-stage-selection-sync.v40.js` 제거.
- `constellation-stage-selection-sync.v41.js` 제거.
- `galaxy-selection-sync.v42.js` 제거.
- `stage-enter-router.v43.js` 제거.

### 4. 일반 START 진입 동작
- 일반 START 진입 시 session/local 저장소의 TEST MODE 관련 키 제거.
- 저장 메타의 `flags.testMode` 제거.
- `TEST_MODE_CONFIG.enabled=false` 고정.
- 갤럭시맵 문구에서 TEST MODE 라벨 제거.

### 5. TEST MODE 진입 동작
- TEST MODE 버튼 또는 URL `?test=1`인 경우에만 현재 세션에서 테스트 모드 활성화.
- 테스트 모드 활성화 키는 sessionStorage 중심으로만 관리.
- 저장 데이터에는 테스트 모드가 남지 않음.

## 검증
- `src/scripts/*.js` 문법 검사 통과.
- `andromeda/src/scripts/*.js` 문법 검사 통과.
- `index.html`, `andromeda/index.html` script 중복 로드 없음.
- script 파일 누락 없음.
- ZIP 무결성 검사 통과.

## 변경하지 않은 영역
- 전투 루프
- 전투 밸런스 JSON
- 웨이브/몬스터/타워 데미지 계산
- 소환/합치기/배속/정지 버튼 기능
- 오디오 파일 및 이미지 리소스
