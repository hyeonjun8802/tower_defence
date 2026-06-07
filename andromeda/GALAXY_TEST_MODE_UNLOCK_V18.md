# Galaxy Test Mode Unlock v18

## 목적
테스트/개발자 모드에서 은하수 맵의 2탄 `ANDROMEDA TRACE`가 자물쇠 상태로 남아 보이는 문제를 보정한다.

## 반영
- 테스트/개발자 모드 감지 강화
  - `TEST_MODE_CONFIG.enabled`
  - `META.flags.testMode`
  - `body.test-mode-active`
  - 저장된 meta test flag
  - URL `?test=1`, `?testMode=1`, `?dev=1`
- 테스트 모드에서는 은하 1~4 전체를 `TEST OPEN`으로 강제 표시
- `ANDROMEDA TRACE` 자물쇠/안개/비활성 enter 상태 제거
- 일반 플레이의 은하수 완료 조건/안개 잠금 규칙은 변경하지 않음

## 범위
- Galaxy map DOM/UI 상태 보정만 수행
- 전투, 스테이지, 저장, 타워, 밸런스, 안드로메다 route 로직은 변경하지 않음
