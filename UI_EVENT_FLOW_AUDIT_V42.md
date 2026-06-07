# UI 이벤트 흐름 전체 점검 리포트 V42

## 점검 목적
최근 발생한 증상은 옵저버 부족이 아니라, 먼저 등록된 `capture` 단계 이벤트가 `stopImmediatePropagation()`을 호출하면서 뒤쪽 UI 동기화 로직을 막는 구조적 충돌이었다.
이번 점검은 같은 유형의 문제가 다른 화면에도 남아 있는지 전체적으로 확인했다.

## 점검 범위
- 메인 `index.html`
- 안드로메다 `andromeda/index.html`
- `src/scripts/*.js`
- `andromeda/src/scripts/*.js`

전투 화면의 캔버스 루프, 소환/합치기/배속/정지, 밸런스 JSON, 오디오 파일은 수정 대상에서 제외했다.

## 확인 결과

### 1. 은하수/안드로메다 스테이지 노드 선택
- 상태: V40/V41에서 이미 수정됨
- 원인: `game-core.js`의 스테이지 노드 클릭 핸들러가 `document capture`에서 `stopImmediatePropagation()`을 호출하여 하단 `ENTER` 버튼 동기화가 막힘
- 조치: `andromeda-stage-selection-sync.v40.js`, `constellation-stage-selection-sync.v41.js`로 `window capture` 단계에서 선택 UI를 먼저 동기화

### 2. 갤럭시맵 은하 노드 선택
- 상태: V42에서 추가 수정
- 원인: `patches.runtime.js`의 오래된 내비게이션 패치가 `#galaxyNodeLayer .galaxyNode[data-galaxy-id]` 클릭을 먼저 가로채고, `stopImmediatePropagation()`으로 신규 갤럭시 브릿지 로직을 막을 수 있음
- 증상 가능성: 안드로메다 노드 클릭 후 하단 `ENTER ANDROMEDA TRACE`가 즉시 안 바뀌거나, 구형 잠금 토스트가 뜨는 문제
- 조치: `galaxy-selection-sync.v42.js` 추가. 은하 노드 선택을 `window capture`에서 먼저 반영하고, 오래된 핸들러가 잘못 개입하지 못하게 정리

### 3. 가로모드 갤럭시 하단 ENTER 버튼
- 상태: V42에서 추가 수정
- 원인: `v274GalaxyEnterBtn` 클릭을 `map-hud-recovery`/`v274` 계열이 먼저 처리하면, 현재 선택 은하와 무관하게 `showStage()`로 빠질 수 있음
- 증상 가능성: 하단 버튼이 `ENTER ANDROMEDA TRACE`로 보여도 실제 진입은 은하수 스테이지맵으로 가는 문제
- 조치: `galaxy-selection-sync.v42.js`에서 `#galaxyEnterBtn`, `#v274GalaxyEnterBtn`, `.galaxyEnterBtn` 클릭을 현재 선택 은하 기준으로 라우팅

### 4. 안드로메다 standalone 내부 갤럭시맵
- 상태: V42에서 추가 안전장치 추가
- 원인: 안드로메다 페이지에도 공통 `patches.runtime.js`가 포함되어 있어, 내부 갤럭시맵이 노출되는 경우 같은 충돌이 재현될 수 있음
- 조치: `andromeda/src/scripts/galaxy-selection-sync.v42.js` 추가. 안드로메다 페이지에서는 `ENTER ANDROMEDA TRACE`가 항상 안드로메다 스테이지맵으로 복귀하도록 고정

### 5. 전투 화면 관련 stopImmediatePropagation
- 상태: 변경하지 않음
- 이유: 전투 입력/일시정지/프록시 버튼은 의도적으로 기존 입력을 차단하는 구조이며, 이번 증상과 다른 영역이다.

## 추가된 파일
- `src/scripts/galaxy-selection-sync.v42.js`
- `andromeda/src/scripts/galaxy-selection-sync.v42.js`

## 수정된 파일
- `index.html`
- `andromeda/index.html`

## 검증 항목
- 전체 JS 문법 검사
- ZIP 무결성 검사
- HTML script tag 삽입 확인

## 수동 확인 체크리스트
1. 메인 메뉴 → 시작 → 갤럭시맵 진입
2. 은하수 노드 클릭 → 하단 버튼 `ENTER MILKY RIFT`
3. 안드로메다 노드 클릭 → 하단 버튼 `ENTER ANDROMEDA TRACE`
4. 가로모드 하단 `ENTER ANDROMEDA TRACE` 클릭 → `andromeda/index.html` 이동
5. 안드로메다 스테이지맵에서 각 행성 클릭 → 하단 버튼 즉시 해당 stage로 변경
6. 은하수 성좌맵에서 각 행성 클릭 → 하단 버튼 즉시 해당 stage로 변경
7. 안드로메다에서 뒤로가기 → 부모 갤럭시맵으로 복귀
