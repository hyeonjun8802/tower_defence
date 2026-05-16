# V132 Route Corner Rail Fix

## 변경 목적
전투 맵 몬스터 이동 경로의 ㄱ자/ㄴ자 코너에서 네온 라인이 겹쳐 보이거나 꺾임부가 지저분해 보이는 문제를 정리했습니다.

## 적용 내용
- 기존 segment-by-segment 방식의 레일 렌더링을 연속 offset polyline 방식으로 변경
- 코너에서 각각의 선분 cap이 겹치지 않도록 miter 교차점을 계산
- 검은 도로 느낌을 더 줄이기 위해 route glow / glass body 두께와 투명도를 축소
- 코너 노드를 사각 다이아몬드에서 작은 원형 발광점으로 변경
- `index.html`, `all_scripts.js` 동일 반영

## 검증
- `node --check all_scripts.js` 통과
