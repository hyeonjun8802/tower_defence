# Andromeda Route Variants v11

## 목적
안드로메다 전용 전투 길을 기존 은하수 맵과 분리하고, 시나리오 진행에 따라 몬스터 이동 루트를 단계적으로 확장한다.

## 적용 범위
- 안드로메다 스테이지에만 적용
- 기존 은하수/legacy 스테이지는 기존 단일 route template 사용
- 밸런스, 타워 공격력, 저장/해금, 보상 로직은 변경하지 않음

## Route progression

| Stage | Route type | 설명 |
|---:|---|---|
| 1~2 | Single lane | 안드로메다 진입부. 기존보다 색감만 다른 단일 루트 |
| 3~4 | Split merge | 1줄로 시작 → 2줄 분기 → 코어 직전 1줄 합류 |
| 5~9 | Dual gate | 시작 게이트 2개 → 중앙 회랑 합류 |
| 10~14 | Dimensional jump | 차원문 구간에서 순간이동. 포탈 링과 점선 연결 표시 |
| 15 | Boss spiral | 최종 보스 전용 소용돌이 루트. 중앙에는 핵심 배치 칸 1개만 개방 |

## 구현 메모
- `routeVariants`를 통해 실제 적이 서로 다른 route를 선택한다.
- split/dual route는 적 스폰 순서 기준으로 route를 분배한다.
- teleport route는 해당 segment를 즉시 이동 처리한다.
- route rendering은 보조 route도 같이 표시하되, 기존 route cache 구조를 크게 건드리지 않도록 보수적으로 확장했다.
