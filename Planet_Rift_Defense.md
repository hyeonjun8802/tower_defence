# Planet Rift Defense v88 통합 정리

> 기준 버전: `v003_saved_v78_refactor_split_v88.zip`  
> 작성 목적: 현재 HTML 기반 게임 프로젝트의 최신 구조, 수정 이력, 유지보수 주의사항, 다음 작업 기준을 한 문서로 정리한다.

---

## 1. 현재 프로젝트 상태 요약

`Planet Rift Defense`는 브라우저에서 `index.html`을 실행하는 우주 배경 타워 디펜스 게임이다.  
현재 버전은 기존 단일 HTML 구조를 v78 기준으로 분리한 뒤, v88까지 전투 화면 시각 보정과 드래그 연출 개선이 반영된 상태다.

현재 가장 중요한 기준은 다음과 같다.

- 은하계 맵 / 성좌 맵 / 스테이지 행성 맵의 좌표와 비율은 최대한 건드리지 않는다.
- 가로모드에서는 맵 콘텐츠를 최대한 보이게 하고, 정보 UI는 `INFO / ENTER` 형태의 하단 HUD 또는 팝업으로 제공한다.
- 세로모드는 기존 동작을 최대한 유지한다.
- 전투 화면은 가로모드 기준으로 블록 크기, 장판 선명도, 드래그 연출을 보정했다.
- 스테이지 클리어 후 다음 스테이지 해금은 `META.clears`와 `StageMapState` 동기화가 핵심이다.
- 테스트/디버그 코드가 실제 진행도에 영향을 주지 않도록 manifest 기반으로 분리하는 방향을 유지한다.

---

## 2. 최신 파일 구조

현재 v88 패키지의 핵심 구조는 다음과 같다.

```text
v003_saved/
  index.html
  GAME_PROJECT_DOCUMENTATION.md
  CLEANUP_REPORT.md
  HUD_UPDATE_REPORT.md
  LANDSCAPE_ARMORY_LAYOUT_REPORT.md
  HUD_VISIBILITY_FIX_REPORT.md
  MAP_HUD_RECOVERY_V74_REPORT.md
  STAGE_BACKGROUND_FULL_COVER_V75_REPORT.md
  STAGE_UNLOCK_MANIFEST_FIX_V76_REPORT.md
  STAGE_UNLOCK_V78_REPORT.md
  REFACTOR_V78_REPORT.md
  REFACTOR_V81_REPORT.md
  REFACTOR_V83_REPORT.md
  REFACTOR_V84_REPORT.md
  STAGE_ENTER_RACE_FIX_V85_REPORT.md
  REFACTOR_V86_REPORT.md
  BATTLE_BOARD_VISUAL_V87_REPORT.md
  BATTLE_BOARD_VISUAL_V88_REPORT.md
  BATTLE_PLATE_DRAG_VISUAL_V88_REPORT.md

  manifests/
    runtime.production.json
    runtime.test.json

  src/
    styles/
      base.css
      patches.runtime.css

    scripts/
      game-core.js
      armory-base.js
      patches.runtime.js
      map-hud-recovery.v83.js

    manifests/
      patch-manifest.json
      runtime.load-order.json

    docs/
      runtime-order.md

    legacy/
      all_scripts.unused.v78.js

  assets/
    images/
      ...

  audio/
    ...
```

---

## 3. 런타임 로드 순서

`index.html`은 분리된 CSS/JS를 아래 순서로 로드한다.

```text
1. src/styles/base.css
2. src/styles/patches.runtime.css
3. src/scripts/game-core.js
4. src/scripts/armory-base.js
5. src/scripts/patches.runtime.js
6. src/scripts/map-hud-recovery.v83.js
```

주의할 점:

- `patches.runtime.css`는 기존 inline patch들의 cascade 순서를 최대한 보존한 파일이다.
- `patches.runtime.js`는 기존 누적 패치 실행 순서를 유지한다.
- `map-hud-recovery.v83.js`는 가로모드 맵 HUD 복구를 위해 별도 분리된 후속 보정 스크립트다.
- `patches.runtime.js`의 앞쪽 패치에서 오류가 나면 뒤쪽 HUD 패치가 실행되지 않을 수 있으므로, 맵 HUD 관련 복구는 별도 파일에서 관리하는 현재 구조가 더 안전하다.

---

## 4. 주요 화면별 현재 기획/구현 기준

### 4.1 은하계 맵

목표:

- 은하계 노드와 경로가 가로모드에서 최대한 잘 보이도록 한다.
- 큰 설명 패널은 상시 노출하지 않는다.
- 필요한 경우 `INFO` 팝업으로 상세 정보를 보여준다.
- `ENTER MILKY RIFT` 버튼은 하단 HUD로 제공한다.

유지해야 할 원칙:

- 은하 노드 좌표와 경로 비율은 수정하지 않는다.
- HUD와 팝업만 조정한다.
- 가로모드에서 버튼이 resize 이후에만 보이는 문제가 재발하지 않도록 `map-hud-recovery.v83.js` 동기화가 필요하다.

---

### 4.2 성좌 / 스테이지 행성 맵

목표:

- 행성 좌표와 경로는 유지한다.
- 선택한 행성 정보는 기본적으로 큰 패널 대신 `INFO` 팝업으로 제공한다.
- `ENTER SANCTUARY N`은 하단 HUD로 제공한다.
- 스테이지 클리어 시 다음 행성이 열려야 한다.

중요 로직:

```text
N번 성역 클리어 → N+1번 성역 해금
```

핵심 상태:

```text
META.clears
StageMapState.unlocked
StageMapState.selected
StageMapState.current
```

주의할 점:

- 화면상 행성은 열려 보이는데 버튼 텍스트가 `ENTER SANCTUARY 1`로 남는 문제가 있었으므로, 버튼 라벨과 선택 스테이지 동기화가 중요하다.
- 스테이지 클리어 직후 지도 복귀 시 전투 HUD가 남지 않아야 한다.
- 테스트 코드가 production 진행도를 덮지 않도록 `runtime.production.json`, `runtime.test.json` 분리를 유지한다.

---

### 4.3 강화 관리 / Armory

목표:

- 가로모드에서는 정보가 너무 커지지 않도록 compact layout을 사용한다.
- 공통 연구 / 타워 / 장판 3개 탭 모두 가로모드 대응이 되어 있다.
- 왼쪽 리스트는 정사각형 아이콘 기준으로 유지한다.
- 성흔 조각 UI는 상단 우측에 정렬하며, 아이콘/텍스트/숫자 y축을 맞춘다.

주요 적용 사항:

- 가로모드 전용 compact layout 적용
- 작은 카드 여러 개 대신 하나의 프레임 안에 여러 정보를 정리하는 구조 적용
- 장판 리스트 아이콘 정사각형 보정
- 성흔 조각 UI y축 보정
- 세로모드 영향 최소화

주의할 점:

- Armory는 패치 누적이 많아서 `patches.runtime.css` 영향이 크다.
- 추가 수정 시 `towerPopup` / `armory-layout-landscape` 관련 CSS 우선순위를 먼저 확인해야 한다.

---

### 4.4 전투 화면

목표:

- 가로모드에서 블록이 너무 작아지지 않도록 한다.
- 하단에 있는 타워 레벨 텍스트가 잘리지 않도록 보드를 약간 위로 올린다.
- 장판은 게임 규칙 색상을 유지하되, 디자인적으로 더 선명하고 덜 뿌옇게 만든다.
- 드래그 중 타워는 살짝 작고 투명하게 보이며, 놓으면 자연스럽게 복귀한다.

v87 적용 사항:

- 전투 블록 크기 확대
- 전투 보드 y축 상향 조정
- 캔버스 backing-store 해상도 개선
- 장판 렌더링 선명도 개선
- 구름/안개 효과 제거
- mist/smoke/dust cloud 관련 연출 및 패널티 제거

v88 적용 사항:

- 스킬 장판 톤 다운
- 장판 규칙 색상 유지
- 몬스터 길처럼 얇은 네온 라인 느낌으로 장판 디자인 조정
- 드래그 중 타워 프리뷰 투명도/크기/톤 조정
- 드래그 대상 타워 scale-down easing 추가
- release 시 rebound 애니메이션 추가

주의할 점:

- 전투 룰, 장판 효과, 경제 수치, 해금 로직은 v88에서 변경하지 않았다.
- 장판 디자인은 `시각 표현`만 수정해야 하며, `plate key`나 효과 값은 바꾸면 안 된다.

---

## 5. 최근 버전별 핵심 변경 이력

### v74 - Map HUD Recovery

- 가로모드에서 은하/성좌 맵이 큰 정보 패널에 가려지는 문제를 완화했다.
- 하단 `INFO / ENTER` HUD 구조를 도입했다.
- 은하/행성 좌표는 유지했다.

### v75 - Stage Background Full Cover

- 스테이지 행성 클릭 시 뒤 배경 이미지가 일부만 차는 문제를 수정했다.
- 각 배경을 `cover`, `center center`, `inset:0` 기준으로 통일했다.

### v76 - Stage Unlock Manifest Fix

- 클리어 후 다음 스테이지 해금 기준을 정리했다.
- production/test manifest 분리를 도입했다.

### v77 - HUD Cleanup

- 게임 종료 후 전투 HUD가 지도 화면 위에 남는 문제를 수정했다.
- 상단 스테이지/돈/코어 UI, 우측 아이콘, 하단 버튼 4개가 비전투 화면에서 숨겨지도록 했다.

### v78 - Stage Unlock Final

- 스테이지 선택과 ENTER 버튼 라벨 동기화를 보강했다.
- `META.clears`, `StageMapState`, 버튼 텍스트의 동기화가 핵심이다.

### v80 - Refactor Split

- 기존 inline CSS/JS를 외부 파일로 분리했다.
- 기능 변경은 의도하지 않았고, 정리/분리가 목적이었다.

### v81 - Landscape Stage Popup Reconnect

- 가로모드에서 행성 클릭 → 정보 팝업 → ENTER 흐름이 끊긴 문제를 복구했다.

### v82 - Patch Isolation Attempt

- 패치 블록을 try/catch로 격리하려 했으나, 후속 패치/타이머가 한꺼번에 실행되며 무한 로딩 문제가 발생했다.
- 이후 v83에서 방향을 바꿨다.

### v83 - Map HUD Recovery Separate File

- HUD 복구를 `map-hud-recovery.v83.js`로 별도 분리했다.
- 전역 MutationObserver를 최소화했다.

### v84 - CSS Asset Path Fix

- CSS 파일 분리 후 이미지 경로가 깨진 문제를 수정했다.
- `assets/images/...` → `../../assets/images/...` 기준으로 외부 CSS 경로를 보정했다.

### v85 - Stage Enter Race Fix

- ENTER 클릭 직후 전투 HUD가 켜졌다 꺼지며 스테이지 진입이 끊기는 레이스 컨디션을 수정했다.
- `PRD_STAGE_ENTERING` 전환 상태로 HUD sync가 전투 진입을 방해하지 않도록 했다.

### v86 - HUD Initial Sync Fix

- 버튼이 resize 이후에만 나타나는 문제를 수정했다.
- `body`, `#galaxyMap`, `#stageMap`, `#menu`, `#game` 표시 상태 변화에 따라 HUD를 재동기화했다.

### v87 - Battle Board Visual

- 전투 보드 크기 확대
- y축 상향
- 장판 선명도 개선
- 구름/안개 효과 제거

### v88 - Battle Plate / Drag Visual

- 스킬 장판 톤 다운 및 네온 라인 스타일 적용
- 드래그 프리뷰 축소/투명화
- 대상 타워 scale-down / rebound 애니메이션 추가

---

## 6. 현재 핵심 주의사항

### 6.1 맵 좌표/비율은 건드리지 않는다

아래 영역은 어렵게 맞춘 좌표와 비율이므로, UI 수정 시 직접 수정하지 않는다.

- 은하계 노드 좌표
- 은하계 경로 SVG / 선 위치
- 성좌/스테이지 행성 좌표
- 성좌 경로 SVG / 선 위치
- 맵 콘텐츠 영역의 기본 비율

수정해야 할 경우에도 HUD, 팝업, 정보 패널만 조정한다.

---

### 6.2 가로모드 HUD는 별도 복구 파일을 유지한다

가로모드 `INFO / ENTER` HUD는 `map-hud-recovery.v83.js`에서 관리한다.

이유:

- 기존 `patches.runtime.js`는 누적 패치가 많아 앞쪽 오류에 영향을 받을 수 있다.
- HUD 복구가 같이 묶이면 버튼이 사라지거나 resize 후에만 나타나는 문제가 재발할 수 있다.

---

### 6.3 테스트 모드는 production 진행도를 덮으면 안 된다

테스트/디버그 진행도는 production 진행도와 분리해야 한다.

허용 조건:

```text
?test
?qa
?debug
localStorage.PLANET_RIFT_TEST_MODE = "1"
```

이 조건이 아닐 때는 테스트용 unlock/full-open 코드가 실행되면 안 된다.

---

### 6.4 전투 HUD는 비전투 화면에서 반드시 숨긴다

게임 종료, 지도 복귀, 메뉴 이동 시 다음 UI는 숨겨져야 한다.

- 상단 스테이지 HUD
- 돈/코어 HUD
- 우측 강화/BGM 아이콘
- 하단 소환/합치기/배속/정지 버튼
- 전투 전용 field overlay

---

### 6.5 CSS 경로는 위치 기준으로 작성한다

CSS가 외부 파일로 분리되어 있으므로 이미지 경로는 HTML 기준이 아니라 CSS 파일 기준으로 해석된다.

예시:

```css
/* index.html inline CSS에서는 가능했지만 외부 CSS에서는 깨질 수 있음 */
url("assets/images/...")

/* src/styles/*.css 기준에서는 이 방식이 안전함 */
url("../../assets/images/...")
```

---

## 7. 검증 체크리스트

### 7.1 기본 실행

- `index.html`을 브라우저에서 열었을 때 무한 로딩이 없는지 확인
- 콘솔 에러가 없는지 확인
- 오디오 권한/자동 재생 관련 경고가 게임 진행을 막지 않는지 확인

### 7.2 은하계 맵

- 가로모드에서 은하 노드가 정상 표시되는지 확인
- `INFO` 버튼 표시 확인
- `ENTER MILKY RIFT` 버튼 표시 확인
- 버튼이 처음부터 보이는지 확인
- 화면 크기를 조금 변경해도 버튼이 사라지지 않는지 확인

### 7.3 성좌/스테이지 맵

- 가로모드에서 행성 이미지가 정상 표시되는지 확인
- 행성 클릭 시 정보 팝업이 열리는지 확인
- `ENTER SANCTUARY N` 버튼이 선택한 행성 번호와 맞는지 확인
- 스테이지 클리어 후 다음 행성이 열리는지 확인
- 게임 종료 후 전투 HUD가 지도 위에 남지 않는지 확인

### 7.4 강화 관리

- 공통 연구 / 타워 / 장판 탭 전환 확인
- 가로모드에서 왼쪽 리스트 아이콘이 정사각형인지 확인
- 장판 리스트가 찌그러지지 않는지 확인
- 성흔 조각 아이콘/텍스트/숫자 y축 정렬 확인

### 7.5 전투 화면

- 블록 크기가 너무 작지 않은지 확인
- 아래쪽 타워의 `Lv.1` 텍스트가 잘리지 않는지 확인
- 장판이 뿌옇지 않고 선명한지 확인
- 구름/안개 효과가 제거되었는지 확인
- 드래그 중 타워가 살짝 작고 투명하게 보이는지 확인
- 드래그 해제 시 자연스럽게 원래 크기로 돌아오는지 확인

---

## 8. 다음 작업 권장 순서

### 1단계: 현재 v88 화면 확인

먼저 v88에서 아래 3개 화면만 집중 확인한다.

```text
1. 은하계 맵 가로모드
2. 스테이지 행성 맵 가로모드
3. 전투 화면 가로모드
```

세로모드는 정상 유지가 우선이고, 불필요하게 건드리지 않는다.

---

### 2단계: HUD 복구 로직 안정화

`map-hud-recovery.v83.js`를 기준으로 다음을 점검한다.

- 초기 로딩 시 버튼 표시
- 맵 전환 시 버튼 표시
- 행성 클릭 시 popup 연결
- ENTER 클릭 시 battle 진입
- battle 종료 후 HUD 숨김/복구

---

### 3단계: 진행도/해금 로직 독립 테스트

스테이지 해금은 별도 테스트 루틴으로 확인하는 게 좋다.

권장 테스트:

```text
초기 상태: clears = []
1번 클리어 후: 2번 unlock
2번 클리어 후: 3번 unlock
12번 클리어 후: 다음 은하 또는 완료 상태 처리
```

테스트 코드는 production 로직과 섞지 말고 manifest 기반으로 분리한다.

---

### 4단계: 패치 정리 2차

현재는 `patches.runtime.css/js`에 누적 패치가 많다.  
다음 단계에서는 도메인별 분리가 필요하다.

권장 구조:

```text
src/scripts/
  core/
    state.js
    storage.js
    audio.js
  map/
    galaxy-map.js
    stage-map.js
    map-hud.js
  battle/
    battle-core.js
    battle-render.js
    battle-input.js
    plate-render.js
  armory/
    armory-core.js
    armory-layout.js
  debug/
    test-mode.js
```

---

## 9. 개발자가 꼭 기억해야 할 금지/주의 항목

- 은하/행성 좌표를 UI 문제 해결 목적으로 직접 움직이지 않는다.
- 전투 장판의 게임 룰 색상/효과값을 디자인 수정 중 바꾸지 않는다.
- 테스트 unlock 코드를 production에서 실행하지 않는다.
- 게임 종료 후 전투 HUD가 지도 화면에 남으면 안 된다.
- 외부 CSS에서는 `assets/...` 직접 경로를 쓰지 않는다.
- `patches.runtime.js` 전체를 try/catch로 강제 감싸는 방식은 무한 로딩 위험이 있으므로 피한다.
- 지도 HUD는 `map-hud-recovery.v83.js`처럼 별도 파일로 관리하는 쪽이 안전하다.

---

## 10. 최신 기준 결론

현재 v88은 다음 목표에 맞춰진 버전이다.

- 맵 좌표/비율을 유지하면서 가로모드 HUD를 팝업/하단 버튼 중심으로 정리
- 스테이지 해금 로직을 `META.clears` 기준으로 보강
- 게임 종료 후 전투 HUD가 지도 위에 남지 않게 정리
- CSS/JS를 외부 파일로 분리하여 유지보수성 개선
- 전투 화면의 블록 크기, 장판 선명도, 드래그 연출을 개선

다음 개발은 기능 추가보다 **HUD 동기화 안정화, 진행도 테스트 분리, 패치 파일 도메인별 재분리** 순서로 가는 것이 좋다.
