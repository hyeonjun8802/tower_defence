# ANDROMEDA BACK ROOT CAUSE FIX V39

## 원인
안드로메다 전용 런타임(`andromeda/index.html`) 안에 기존 공통 Galaxy Map DOM과 내비게이션 패치가 그대로 포함되어 있었습니다.

`andromeda-direct-boot.v34.js`는 `#stageMapBack`의 `onclick`을 부모 `../index.html`로 이동하도록 바꾸고 있었지만, 그보다 앞서 로드된 공통 내비게이션 패치가 `#stageMapBack`과 `#stageGalaxyBtn`에 capture-phase click listener를 직접 등록하고 `stopImmediatePropagation()`을 호출했습니다.

그래서 안드로메다 스테이지맵에서 뒤로 가면 부모 메인 Galaxy Map으로 나가지 않고, 같은 `andromeda/index.html` 내부의 숨겨진 Galaxy Map이 다시 표시되었습니다. 이때 URL은 여전히 `/andromeda/index.html`이고, 안드로메다 테스트 플래그/텍스트가 섞여 화면이 깨진 것처럼 보였습니다.

## 수정
- 옵저버 추가 없음
- 전투 화면/전투 루프 수정 없음
- 안드로메다 전용 페이지에서 `#stageMapBack`, `#stageGalaxyBtn` 클릭을 document capture 단계에서 먼저 가로채 부모 `../index.html?from=andromeda`로 이동
- 부모 `index.html?from=andromeda` 진입 시 메인 Galaxy Map을 명시적으로 표시하고 Andromeda 노드를 선택
- bfcache 복원 시에도 안드로메다 전용 페이지가 잘못된 화면 상태로 살아나지 않도록 `pageshow`에서 stage map 상태만 재확인

## 변경 파일
- `andromeda/src/scripts/andromeda-direct-boot.v34.js`
- `src/scripts/galaxy-andromeda-direct-bridge.v37.js`

## 미변경
- 전투 화면
- 캔버스/타워/적/밸런스/오디오/리소스
