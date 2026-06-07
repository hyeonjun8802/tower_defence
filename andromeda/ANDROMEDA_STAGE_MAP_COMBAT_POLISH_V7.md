# ANDROMEDA Stage Map & Combat Front Polish v7

## 목표
- 안드로메다 스테이지맵의 소용돌이 중심 진입감을 강화한다.
- 새로 추가된 15개 노드가 가로/세로/짧은 가로 화면에서 겹치거나 패널 밖으로 밀리지 않도록 최종 CSS override를 추가한다.
- 전투 화면은 기존 전투 로직을 건드리지 않고, 안드로메다 챕터 분위기만 시각적으로 보강한다.

## 스테이지맵 보완
- `#stageMap`에 `andromedaTraceMap` 클래스를 자동 부여한다.
- 기존 단일 SVG route를 숨기고, 외곽/중간/내부/코어 4개 구간 route를 새로 그린다.
- 구간별 색상은 기획 기준에 맞춰 `cyan → violet → magenta → red`로 분리했다.
- nodeType별 badge와 글로우를 추가했다.
- randomBuff 노드는 색상 순환 코어로 표시한다.
- finalBoss 노드는 중앙 코어 느낌을 위해 크기, 링, glow를 분리했다.
- 모바일에서는 노드 라벨과 타입 badge를 줄이거나 숨겨 터치 영역과 정보 패널 충돌을 막는다.

## 전투 화면 보완
- 전투 진입 시 `body.prd-andromeda-combat-v7` 클래스를 자동 동기화한다.
- 전투 field에 안드로메다 챕터별 배경 레이어를 추가한다.
- 외곽/중력/코어 구간에 따라 field glow가 달라진다.
- route rail 색상도 stageNo 기준으로 cyan, violet, magenta/red 계열로 변화한다.
- 상단 HUD와 wave preview를 안드로메다 톤으로 통일했다.
- 필드 좌상단에 현재 안드로메다 전투 구간을 작게 표시한다.

## 안전 범위
- 몬스터 HP, 보상, 타워 공격, 저장, 해금, 전투 입력 로직은 변경하지 않았다.
- CSS와 시각 상태 동기화 JS만 추가했다.
- 기존 전투 캔버스 렌더링은 route 색상 팔레트만 교체했다.
