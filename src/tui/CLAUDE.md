# TUI Layer

ink(React for CLI) 기반 대화형 인터페이스.

## 구조

| 디렉토리 | 용도 |
|---------|------|
| `components/` | 재사용 가능한 UI 컴포넌트 |
| `screens/` | 화면 단위 컴포넌트 |
| `hooks/` | 커스텀 React 훅 |

## 진입점

- `mch` (인자 없음) → TUI 메인 메뉴
- `mch add/search/list` → 기존 CLI

## 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `Header` | 타이틀 + 브레드크럼 |
| `Menu` | ink-select-input 래퍼 |
| `Spinner` | 로딩 상태 표시 |
| `KeyHint`, `KeyHintBar` | 단축키 안내 |
| `ErrorBanner` | 에러 메시지 표시 |
| `ContextCard`, `ContextList` | Context 항목 표시 |

## 화면

| 화면 | 설명 |
|------|------|
| `MainMenu` | 메인 메뉴 (Add/Search/List/Exit) |
| `AddScreen` | 컨텍스트 추가 (멀티스텝 폼) |
| `SearchScreen` | 검색 (semantic/exact/tag) |
| `ListScreen` | 목록 + 필터 + 페이지네이션 |
| `DetailScreen` | 상세 보기 + 유사 문서 검색 |

## 훅

| 훅 | 설명 |
|----|------|
| `useServices` | Core 서비스 팩토리 접근 |
| `useAsyncAction` | 비동기 작업 상태 관리 |
| `useNavigation` | 화면 네비게이션 상태 |

## 키보드 단축키

| 키 | 동작 |
|----|------|
| `↑↓` | 목록 탐색 |
| `←→` | 페이지 이동 |
| `Enter` | 선택/확인 |
| `Esc` | 뒤로가기 |
| `q` | 종료 (메인 메뉴에서만) |

## 기술 스택

- ink 6.x (ESM, React 19)
- ink-text-input, ink-select-input, ink-spinner
