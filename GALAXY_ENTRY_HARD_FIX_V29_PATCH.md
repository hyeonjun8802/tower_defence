# V29 Galaxy Entry Hard Fix

- START DEFENSE 클릭 시 기존 스테이지 맵으로 바로 이동하던 경로를 차단하고 은하 선택 화면을 먼저 열도록 수정
- 스테이지 맵 뒤로가기 버튼을 MAIN이 아니라 GALAXY로 복귀하도록 수정
- 기존 핸들러가 나중에 덮어써도 capture 이벤트와 inline onclick으로 은하 진입을 우선 적용
- V28 렌더링이 실패해도 은하 카드가 표시되도록 fallback 렌더러 추가
