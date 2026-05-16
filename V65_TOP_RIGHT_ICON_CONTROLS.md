# V65 Top-right Icon Controls

## 변경 사항
- 전투 화면의 `타워` 조작을 하단 좌측 큰 버튼에서 맵 우측 상단의 작은 원형 아이콘으로 이동했습니다.
- `BGM ON/OFF` 조작을 하단 버튼에서 맵 우측 상단의 작은 원형 아이콘으로 이동했습니다.
- 하단 COMMAND 영역은 `랜덤 소환`, `타워 합치기`, `1x`, `일시정지` 4개만 남기도록 정리했습니다.
- 원형 아이콘은 새 PNG 파일 2개로 추가했습니다.
  - `ui_icon_tower.png`
  - `ui_icon_bgm.png`
- 아이콘 크기와 밝기를 낮춰 게임 화면에서 과하게 튀지 않도록 보정했습니다.

## 검증
- `audioBtn`, `towerMenuBtn` ID 중복 없음.
- JavaScript 문법 검사 통과: `node --check`.
- BGM 버튼은 텍스트 변경 대신 `aria-label`, `title`, `aria-pressed`, `is-off` 클래스로 상태를 표시합니다.
