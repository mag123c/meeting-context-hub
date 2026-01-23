## [1.10.1](https://github.com/mag123c/meeting-context-hub/compare/v1.10.0...v1.10.1) (2026-01-23)


### Bug Fixes

* **audio:** filter short chunks and validate duration before Whisper API ([5d78162](https://github.com/mag123c/meeting-context-hub/commit/5d78162297fc5a355eb6dad86bb5785ecf57240b))

# [1.10.0](https://github.com/mag123c/meeting-context-hub/compare/v1.9.3...v1.10.0) (2026-01-23)


### Features

* **tui:** add progress indicator for audio transcription ([6489441](https://github.com/mag123c/meeting-context-hub/commit/6489441228ff7598abcc46102e640eb0d91f0ce5))

## [1.9.3](https://github.com/mag123c/meeting-context-hub/compare/v1.9.2...v1.9.3) (2026-01-23)


### Bug Fixes

* **audio:** skip short chunks that Whisper API rejects ([8776523](https://github.com/mag123c/meeting-context-hub/commit/8776523dca989cf07c40c6a182782f28c897213a))

## [1.9.2](https://github.com/mag123c/meeting-context-hub/compare/v1.9.1...v1.9.2) (2026-01-23)


### Bug Fixes

* **preflight:** fallback to openSync when accessSync fails on macOS ([2afb984](https://github.com/mag123c/meeting-context-hub/commit/2afb984edb1efcade7fe65f7dae4b29d8569b6a4))

## [1.9.1](https://github.com/mag123c/meeting-context-hub/compare/v1.9.0...v1.9.1) (2026-01-23)


### Bug Fixes

* **tui:** directory navigation in autocomplete input ([5e78daa](https://github.com/mag123c/meeting-context-hub/commit/5e78daa6f78560f87372979d746455dce6041ea7))

# [1.9.0](https://github.com/mag123c/meeting-context-hub/compare/v1.8.2...v1.9.0) (2026-01-23)


### Features

* **audio:** auto-split large audio files for Whisper API ([ced0d2c](https://github.com/mag123c/meeting-context-hub/commit/ced0d2c6f106b650d122394109c4a80aee14cb8a))

## [1.8.2](https://github.com/mag123c/meeting-context-hub/compare/v1.8.1...v1.8.2) (2026-01-23)


### Bug Fixes

* **tui:** Enter always submits, preserve @ during input ([311e316](https://github.com/mag123c/meeting-context-hub/commit/311e316ee0f7027e5b30ac1efcd69a184a0ac2d2))

## [1.8.1](https://github.com/mag123c/meeting-context-hub/compare/v1.8.0...v1.8.1) (2026-01-22)


### Bug Fixes

* **tui:** clear terminal on startup for clean UI ([f8d5ada](https://github.com/mag123c/meeting-context-hub/commit/f8d5ada73eb7834f43f397ec672fdd2f8659673e))

# [1.8.0](https://github.com/mag123c/meeting-context-hub/compare/v1.7.0...v1.8.0) (2026-01-22)


### Features

* **tui:** add file path autocomplete with @ trigger and clipboard support ([0f813ed](https://github.com/mag123c/meeting-context-hub/commit/0f813edaa46b5a5e4239f579ab94e12d1b6f387d))

# [1.7.0](https://github.com/mag123c/meeting-context-hub/compare/v1.6.0...v1.7.0) (2026-01-22)


### Features

* **recording:** add transcription retry logic and audio-to-meeting flow ([6e13ca9](https://github.com/mag123c/meeting-context-hub/commit/6e13ca9efca55c062cfd0393b0ebce7c18f1eee9))

# [1.6.0](https://github.com/mag123c/meeting-context-hub/compare/v1.5.0...v1.6.0) (2026-01-22)


### Features

* **config:** add vault path configuration and recording save ([40b199c](https://github.com/mag123c/meeting-context-hub/commit/40b199ccc8fd89c07f20b038eb173c3c97e25063))

# [1.5.0](https://github.com/mag123c/meeting-context-hub/compare/v1.4.0...v1.5.0) (2026-01-22)


### Features

* **tui:** add update banner and auto-exit after update ([831e4e9](https://github.com/mag123c/meeting-context-hub/commit/831e4e9e38d968218d7cf4a902d2bf600153b25f))

# [1.4.0](https://github.com/mag123c/meeting-context-hub/compare/v1.3.0...v1.4.0) (2026-01-22)


### Features

* **tui:** add ASCII art banner to main menu ([4c2cacc](https://github.com/mag123c/meeting-context-hub/commit/4c2cacc410e6155bf2876872a9aca0ab16a9f02a))

# [1.3.0](https://github.com/mag123c/meeting-context-hub/compare/v1.2.0...v1.3.0) (2026-01-22)


### Features

* **tui:** add version display and auto-update functionality ([43ce2bc](https://github.com/mag123c/meeting-context-hub/commit/43ce2bc81e2ee549bf5ca6d7dc5be09428e3e986))

# [1.2.0](https://github.com/mag123c/meeting-context-hub/compare/v1.1.1...v1.2.0) (2026-01-21)


### Bug Fixes

* **recording:** fix React state timing issue in TUI recording ([a992c17](https://github.com/mag123c/meeting-context-hub/commit/a992c17206b52c93d1621e84951a7a3414822091))
* remove dotenv dependency and update tests for preflight validation ([c325e06](https://github.com/mag123c/meeting-context-hub/commit/c325e06454184687b6f161221966606900d73e31))


### Features

* add pre-flight validation system and comprehensive edge case fixes ([0a39da3](https://github.com/mag123c/meeting-context-hub/commit/0a39da39761590b38c168d3b01187ca69a69ac88))
* **recording:** add dependency check and TUI error boundary ([059c7ee](https://github.com/mag123c/meeting-context-hub/commit/059c7eea5b65fd085a285f6565ed858402eb1d56))
* **tui:** add API key guard for screen navigation ([5fcd0da](https://github.com/mag123c/meeting-context-hub/commit/5fcd0da0dcb4e1b96554f82cb7a65db28807d389))
* **tui:** add i18n system with English and Korean support ([1d3ea18](https://github.com/mag123c/meeting-context-hub/commit/1d3ea18ca4df99f74d2f9bb303b5001f2b6a8061))

## [1.1.1](https://github.com/mag123c/meeting-context-hub/compare/v1.1.0...v1.1.1) (2026-01-21)


### Bug Fixes

* **ci:** add stat mock and require CI success for release ([6b0c26d](https://github.com/mag123c/meeting-context-hub/commit/6b0c26d8859da8900d25f9085d6d5e9dd16e0fc6))

# [1.1.0](https://github.com/mag123c/meeting-context-hub/compare/v1.0.0...v1.1.0) (2026-01-21)


### Features

* add AI-powered automatic hierarchy classification system ([647e197](https://github.com/mag123c/meeting-context-hub/commit/647e197516ff6e9a03fab409b69d3ed96d501412))
* **tui:** add microphone recording with auto-chunking ([96eaf9b](https://github.com/mag123c/meeting-context-hub/commit/96eaf9b580cf29991c8f7acf899aedbc6693543d))

# 1.0.0 (2026-01-21)


### Bug Fixes

* **ci:** add permissions for semantic-release to push ([5b73894](https://github.com/mag123c/meeting-context-hub/commit/5b73894f5654acccdb288f7bd507ad7d3c47189d))
* hydration error 수정 및 다크 모드 강제 적용 ([e25eef6](https://github.com/mag123c/meeting-context-hub/commit/e25eef69b8ca21dafca50c42718ed23d116942f1))
* 관련 문서 유사도 기준 70% → 60%로 조정 ([3ac97b6](https://github.com/mag123c/meeting-context-hub/commit/3ac97b60f09bdd49e70c2b12a149498a55235e09))
* 로컬 경로 제거 및 settings.local.json gitignore 추가 ([0b76644](https://github.com/mag123c/meeting-context-hub/commit/0b7664440ed6f80284d52b441c4143d41870d304))
* 이미지 태그 추출 개선 - Vision API에서 직접 태그 추출 ([157fe20](https://github.com/mag123c/meeting-context-hub/commit/157fe20c06afcb33c5d5f5a6da829060903ac613))
* 전체 페이지 레이아웃 일관성 수정 (Navbar 추가) ([4d0377e](https://github.com/mag123c/meeting-context-hub/commit/4d0377e3465e271fdf0ba4d086afa7a182d6af9c))


### Features

* ink 기반 TUI 추가 ([2b49997](https://github.com/mag123c/meeting-context-hub/commit/2b4999737a5aa1a18ae1cecd737355ceccdf6370))
* P1 기능 구현 - 검색 링크, 페이지네이션, 스켈레톤 로딩 ([ddcee14](https://github.com/mag123c/meeting-context-hub/commit/ddcee1481f9e26799c67552b63fcc18d449510ee))
* Phase 1 프로젝트 셋업 ([2a234f6](https://github.com/mag123c/meeting-context-hub/commit/2a234f64021be3a46d0460b3674b6c439b75ebac))
* Phase 2 핵심 인프라 ([2ea0e21](https://github.com/mag123c/meeting-context-hub/commit/2ea0e211ee03e470e1b466e893a4d4d8bf824de4))
* Phase 3 회의록 요약 기능 ([9920882](https://github.com/mag123c/meeting-context-hub/commit/9920882183f1a4adac643de0688352255b6d018c))
* Phase 4 컨텍스트 그룹핑 기능 ([32013ef](https://github.com/mag123c/meeting-context-hub/commit/32013eff77574dc0d1be26444e70246bff89e80c))
* Phase 5 외부 연동 구현 ([27907fb](https://github.com/mag123c/meeting-context-hub/commit/27907fb1bc48e96ab8154c017538c8ac7fe4e1ea))
* Phase 6 검색/트래킹 기능 ([08de6ce](https://github.com/mag123c/meeting-context-hub/commit/08de6ceaa610c4e08504a4dc6cf062578142608b))
* Supabase 웹앱을 Obsidian-only CLI로 전환 ([b67152f](https://github.com/mag123c/meeting-context-hub/commit/b67152f602af3c6cda149cc0aaf8477b9b8ff633))
* UI 컴포넌트 및 레이아웃 ([d518cfe](https://github.com/mag123c/meeting-context-hub/commit/d518cfefd96751178190ec69a3028aa2cf6fc988))
* UseCase Factory 및 Custom Hooks 구현 ([8cb2a7a](https://github.com/mag123c/meeting-context-hub/commit/8cb2a7ac7c62163c493fa13803e3896e6d41f799))
* 검색 개선, Obsidian 파일명 개선, 출력 순서 버그 수정 ([63ac740](https://github.com/mag123c/meeting-context-hub/commit/63ac7400ba4087536367f38075f6dbc9d53ed675))
* 도메인 모델 재설계 - Sprint/Project/Squad/ActionItem 엔티티 추가 ([0ea726b](https://github.com/mag123c/meeting-context-hub/commit/0ea726b58a84ca180734149cf179325a8083cfd4))
* 스프린트 페이지 및 API 구현 ([216adb6](https://github.com/mag123c/meeting-context-hub/commit/216adb699e6f7349522082d4f71fa4b004a8aa1b))
* 업데이트 알림 기능 추가 ([b004424](https://github.com/mag123c/meeting-context-hub/commit/b00442416c405287534337910e7f67422b7ecf30))
* 태그 편집 기능 구현 ([b8e3767](https://github.com/mag123c/meeting-context-hub/commit/b8e376732b44d1e2a54ed6fef96689536bf49633))
* 프로젝트/스프린트 메타데이터 및 관련 문서 자동 링크 ([7c3f013](https://github.com/mag123c/meeting-context-hub/commit/7c3f013d6ac23cdc872eddbfe1f6f634fec4aee6))
* 회의록 수정/삭제 UI 구현 ([d7c9df8](https://github.com/mag123c/meeting-context-hub/commit/d7c9df884f71be2e0c8dea48409223b033801401))
* 회의록 요약 기능 추가 (mch add -m) ([a15902e](https://github.com/mag123c/meeting-context-hub/commit/a15902edfb752fca9a429d2931e4a7751fdcaf93))
