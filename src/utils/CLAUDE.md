# Utils Directory

공통 유틸리티 함수 모음.

## 파일 구조

| 파일 | 용도 |
|------|------|
| `json-parser.ts` | JSON 파싱 (마크다운 코드블록 처리 포함) |
| `file-validator.ts` | 파일 존재/확장자 검증 |
| `filter.ts` | Context 필터링 (tags, type, project, sprint) |
| `related-links.ts` | 관련 문서 링크 추가 |
| `index.ts` | 모든 유틸리티 re-export |

## 사용 패턴

```typescript
import { extractJsonFromMarkdown, parseMetadata } from "../utils/index.js";
import { validateFile } from "../utils/index.js";
import { applyFilters } from "../utils/index.js";
import { addRelatedLinks } from "../utils/index.js";
```
