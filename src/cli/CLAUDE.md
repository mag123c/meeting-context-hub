# CLI Layer

사용자 입력 처리 및 출력 포매팅 담당.

## 구조

| 디렉토리 | 용도 |
|---------|------|
| `commands/` | CLI 명령어 구현 (add, search, list, config) |
| `utils/` | CLI 공통 유틸리티 (스피너, 포매팅, 에러 처리) |

## CLI Utils

### cli-runner.ts

| 함수 | 설명 |
|------|------|
| `withSpinner(fn, options)` | 공통 스피너 + 에러 처리 래퍼 |
| `exitWithError(message)` | 에러 출력 후 프로세스 종료 |

### formatters.ts

| 함수 | 설명 |
|------|------|
| `formatContextMeta(ctx)` | Context 저장 결과 출력 |
| `formatMeetingResult(meeting, project, sprint)` | 회의록 요약 결과 출력 |
| `formatSearchResult(ctx)` | 검색 결과 포매팅 |
| `padEnd(str, length)` | 문자열 패딩 유틸리티 |

## 사용 패턴

```typescript
import { withSpinner, formatContextMeta } from "../utils/index.js";

await withSpinner(async (spinner) => {
  spinner.start("Processing...");
  const result = await doSomething();
  spinner.succeed("Done!");
  formatContextMeta(result);
}, { failText: "Failed to process" });
```
