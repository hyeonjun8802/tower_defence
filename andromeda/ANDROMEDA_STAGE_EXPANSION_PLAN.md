# 안드로메다 스테이지 확장 적용 계획 / 반영 내역

## 1단계: 데이터 확장
- STAGE_MAP_DEFS를 15개 안드로메다 소용돌이 노드로 교체
- COMMERCIAL_STAGE_BALANCE와 balance/stage_balance.v2.json을 기획서 HP/속도/물량/보상 계수 기준으로 15개 확장
- runtime manifest maxStage를 15로 확장

## 2단계: 스테이지맵 확장
- index.html의 stageNode 12개를 15개로 확장
- 기획서 좌표 기준으로 1→15가 중심으로 들어가는 소용돌이형 노드 배치 적용
- finalBoss/randomBuff/prism/portal 등 nodeType을 data 속성으로 추가
- 부족 이미지 리소스는 CSS 행성 노드 렌더링을 임시 재사용

## 3단계: 몬스터/보스 1차 구현
- M01, M02, M04, M05, M06, M07, M10을 기존 엔진의 HP/속도/보호막/회피/보상/코어 피해 속성으로 임시 구현
- B01/B02/B03 성격의 스테이지별 중간/최종 보스 데이터를 15개로 확장
- M03/M08/M09와 진짜 다중 route는 2차 구현으로 보류

## 4단계: 검증
- JS 문법 검사
- JSON 파싱 검사
- stage max 15 / HTML node 15 / stage balance 15 / monster pool 15 정합성 검사
- ZIP 무결성 검사

## 이미지 리소스 TODO
- assets/images/backgrounds/bg_andromeda_outer.webp
- assets/images/backgrounds/bg_andromeda_gravity.webp
- assets/images/backgrounds/bg_andromeda_core.webp
- assets/images/stage_nodes/andromeda_node_01.webp ~ andromeda_node_15.webp

현재는 위 리소스가 없어도 기존 CSS 노드/배경을 재사용해서 실행되도록 처리했습니다.


## v2 보완 반영

### 시나리오/맵 UI 보완
- 스테이지맵 타이틀을 `ANDROMEDA TRACE`로 교체했습니다.
- 기존 CSS에 남아 있던 1~4번 노드 좌표 강제값을 최종 15개 소용돌이 좌표로 다시 덮어썼습니다.
- 외곽/중간/중심부 색 흐름이 cyan → violet → magenta → red로 보이도록 연결선과 배경 glow를 보정했습니다.

### 6-4 / 6-5 핵심 규칙 보완
- 6-4 수호자의 심장: wave 시작마다 U 칸 성격이 amp/coil/lens/mine 중 하나로 고정 결정됩니다.
- 6-5 안드로메다의 잔향: 중앙 K 역할을 하는 핵심 amp/lens 배치 칸이 강제로 생성됩니다.
- U/K 규칙은 신규 엔진을 만들지 않고 기존 장판 시스템 위에 얹었습니다.

### 몬스터 기믹 보완
- M01/M04: 짧은 추진/직선 가속을 속도 부스트로 반영했습니다.
- M05: 주변 적 속도 오라를 반영했습니다.
- M07: 근처에 3기 이상 뭉치면 행렬 속도 보너스를 받습니다.
- M10: 14~15스테이지에서 특수 장판 근처를 지날 때 피해 흡수 효과를 받습니다.

### 아직 보류
- 진짜 다중 route 엔진
- M08/M09의 허상/견인 고급 교란
- T01/T02/T03 완전 신규 타워 타입과 전용 투사체
