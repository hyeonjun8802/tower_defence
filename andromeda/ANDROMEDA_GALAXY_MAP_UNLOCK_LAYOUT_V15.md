# Andromeda Galaxy Map Unlock / Layout Fix V15

## 목적
- 은하수 캠페인 완료 전에는 안드로메다를 잠금 상태로 유지한다.
- 테스트/개발자 모드에서는 모든 은하를 열어 QA가 가능하게 한다.
- 은하수 맵 화면의 노드 위치, 선택 상태, 하단 패널 간격이 어긋나 보이는 문제를 보정한다.

## 적용 규칙
- 기본 상태: MILKY RIFT만 OPEN
- 은하수 완료 기록 감지 시: ANDROMEDA TRACE OPEN
- 안드로메다 완료 기록 감지 시: EMBER SPIRAL PREVIEW/OPEN 준비
- 테스트 모드: 4개 은하 모두 TEST OPEN

## 완료 기록 호환
- `planetRiftOfflineMetaV2.flags.milkyRiftCompleted`
- `planetRiftOfflineMetaV2.flags.galaxyMilkyRiftCompleted`
- 구버전 stage 12 clear 기록
- 현재 확장 기준 stage 15 clear 기록은 안드로메다 완료로 처리

## 디자인 보정
- active 노드가 translate 중복으로 밀리는 문제 제거
- 은하 노드 4개 좌표 재정렬
- 다음 은하는 흐릿한 안개 미리보기
- 먼 은하는 짙은 공허 안개 처리
- 잠금 ENTER 버튼과 landscape dock ENTER 버튼 모두 비활성 스타일 적용

## 변경하지 않은 것
- 전투 밸런스
- 전투 route
- 스테이지맵 15개 노드
- 타워/보상/저장/히든 행성 로직
