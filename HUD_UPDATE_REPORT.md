# HUD Update Report v48

## 반영 내용

- 전투 화면 상단에 작은 투명 HUD 추가
- 왼쪽: 스테이지 정보 왼쪽 정렬
- 오른쪽: 돈, 코어 정보 오른쪽 정렬
- 경험치/레벨 정보는 전투 HUD에서 숨김 처리
- 돈 아이콘은 성흔 조각 느낌의 노란색 조각형 CSS 아이콘으로 추가
- 코어 아이콘은 코어 수치 색상과 맞춘 작은 붉은 코어형 CSS 아이콘으로 추가
- 기존 강화/BGM 버튼과 겹치지 않도록 재화 HUD는 우측에서 약간 안쪽으로 정렬
- 새 HUD는 pointer-events:none 처리로 블록 선택/드래그를 방해하지 않음

## 수정 파일

- index.html

## 추가된 패치 ID

- v240-compact-transparent-top-hud-final
- v240-compact-transparent-top-hud-final-script
