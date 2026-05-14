# V15 Stage Bottom Text Sync Patch

사용자가 지적한 하단 정보 텍스트 고정 문제만 집중 수정했습니다.

## 수정 내용
- 스테이지 클릭 시 하단 `1장. 공허 성역` 영역이 선택 스테이지 기준으로 직접 갱신되도록 변경
- 하단 정보 블록을 `stageNo` 기준으로 다시 생성
  - 장 제목
  - 성역명
  - 별자리명
  - 시나리오 설명
  - 위험도
  - 클리어/최고 웨이브
  - 보상/전역 효과
  - 중간 보스/최종 보스 설명
  - 숙련도 목표
- `renderOfflineMetaPanel()`의 선택값 꼬임에 의존하지 않도록 `syncStageBottomInfo(stageNo)`에서 직접 텍스트 생성
- `data-selected` 변경을 감시하는 MutationObserver 추가
- 스테이지 노드 `pointerup/touchend`에서도 하단 텍스트를 강제 갱신

## 범위
- 맵 구조나 게임 밸런스는 건드리지 않음
- 사용자가 말한 하단 텍스트 영역만 집중 수정
