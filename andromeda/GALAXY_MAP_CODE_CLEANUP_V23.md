# Galaxy Map Code Cleanup v23

## 목적
은하수맵/안드로메다 해금 UI에 v13, v15, v18, v19, v20, v21, v22 패치가 순차적으로 누적되면서 서로 다른 테스트모드 규칙이 동시에 실행되던 문제를 정리한다.

## 발견된 문제
- `patches.runtime.js` 내부에 은하 해금 관련 DOM 컨트롤러가 여러 개 중복 존재했다.
- v18~v20은 테스트모드에서 전체 은하를 여는 로직을 가지고 있었고, v22는 다시 1~2번만 열도록 덮어쓰는 구조였다.
- 이 때문에 자물쇠가 남거나, 반대로 3~4번 은하까지 열리는 상태가 반복될 수 있었다.
- 테스트모드 상태 판정도 `TEST_MODE_CONFIG`, body class, localStorage, 화면 텍스트를 여러 패치가 다르게 읽고 있었다.

## 정리 방식
- `patches.runtime.js`에서 은하맵 컨트롤러 v13/v15/v18/v19/v20 누적 블록 제거.
- 구 `galaxy-testmode-hard-unlock.v21.js` 파일을 제거하고, 단일 컨트롤러 `src/scripts/galaxy-map-controller.v23.js`로 교체.
- `index.html` script 경로도 새 컨트롤러로 변경.
- CSS에서 테스트모드 전체 해금용 v18~v20 override 제거.
- 정상 잠금/안개 표현은 유지하되, v23 전용 최종 상태 클래스를 추가.

## 최종 규칙
### 일반 플레이
- 1번 `MILKY RIFT`: OPEN
- 2번 `ANDROMEDA TRACE`: 은하수 완료 후 OPEN
- 3번 `EMBER SPIRAL`: 다음 확장 은하, 잠금/preview fog
- 4번 `VOID CROWN`: 먼 확장 은하, deep fog

### 테스트/개발자 모드
- 1번 `MILKY RIFT`: OPEN
- 2번 `ANDROMEDA TRACE`: TEST OPEN
- 3번 `EMBER SPIRAL`: LOCKED + preview fog
- 4번 `VOID CROWN`: LOCKED + deep fog

## 변경하지 않은 영역
- 전투 밸런스
- 안드로메다 몬스터 길
- Stage 15 소용돌이 route
- 신규 타워/몬스터 로직
- 히든 행성 로직
- 저장 스키마
- BGM/오디오
