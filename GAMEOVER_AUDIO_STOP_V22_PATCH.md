# V22 Game Over Audio Stop Patch

- 게임오버 발생 즉시 현재 재생 중인 BGM을 중지합니다.
- 게임오버 결과 BGM을 재생하지 않도록 변경했습니다.
- 이미 재생 중인 HTMLAudio SFX clone도 추적해서 게임오버 시 함께 중지합니다.
- WebAudio 기반 합성 효과음도 게임오버 시 suspend 처리합니다.
- 재도전 시에는 기존 스테이지 진입 흐름을 통해 BGM이 다시 재생됩니다.
