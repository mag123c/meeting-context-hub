# Application (UseCase)

## 역할

Application Layer - 비즈니스 로직 및 유스케이스

## 의존성

- `repositories/` (인터페이스)
- `storage/` (구현체)
- `lib/ai/` (AI 처리)

## 파일 구조

| 파일 | 역할 |
|------|------|
| `summarize-meeting.usecase.ts` | 회의록 요약 (PRD + Action Items + Obsidian 저장) |
| `extract-tags.usecase.ts` | 컨텍스트 태그 추출 (Obsidian 저장 포함) |
| `search-context.usecase.ts` | Q&A 검색 |

> 참고: Obsidian 저장은 각 UseCase 내에서 직접 처리

## 규칙

1. **네이밍**: `{action}-{entity}.usecase.ts`
2. **단일 책임**: 하나의 유스케이스는 하나의 비즈니스 기능
3. **Repository 의존**: 직접 DB 접근 금지
4. **트랜잭션**: 여러 저장소 작업은 트랜잭션으로 묶기

## 유스케이스 패턴

```typescript
export class SummarizeMeetingUseCase {
  constructor(
    private meetingRepo: MeetingRepository,
    private tagRepo: TagRepository,
    private claudeClient: ClaudeClient
  ) {}

  async execute(userId: string, input: CreateMeetingInput): Promise<MeetingWithTags> {
    // 1. PRD 요약 생성
    // 2. Action Items 추출
    // 3. 태그 추출/생성
    // 4. Meeting 저장
    // 5. Obsidian 파일 생성
    return meeting;
  }
}
```
