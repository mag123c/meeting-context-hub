import type { MeetingRepository } from "@/repositories/meeting.repository";
import type { ContextRepository } from "@/repositories/context.repository";
import { callClaude } from "@/lib/ai/claude";
import { QA_SEARCH_PROMPT, buildQASearchPrompt, type QASearchOutput } from "@/lib/ai/prompts";

export interface SearchResult extends QASearchOutput {
  query: string;
}

export class SearchContextUseCase {
  constructor(
    private meetingRepo: MeetingRepository,
    private contextRepo: ContextRepository
  ) {}

  async execute(userId: string, query: string): Promise<SearchResult> {
    // 1. 관련 회의록 검색
    const meetingsResult = await this.meetingRepo.search(userId, query, {
      page: 1,
      limit: 5,
    });

    // 2. 관련 컨텍스트 검색
    const contextsResult = await this.contextRepo.search(userId, query, {
      page: 1,
      limit: 10,
    });

    // 3. 검색 결과 포맷팅
    const meetings = meetingsResult.data.map((m) => ({
      id: m.id,
      title: m.title,
      summary: m.prd_summary
        ? `Problem: ${m.prd_summary.problem}\nGoal: ${m.prd_summary.goal}`
        : m.raw_content.slice(0, 500),
    }));

    const contexts = contextsResult.data.map((c) => ({
      id: c.id,
      content: c.content.slice(0, 500),
      tags: c.tags.map((t) => t.name),
    }));

    // 4. 검색 결과가 없으면 기본 응답
    if (meetings.length === 0 && contexts.length === 0) {
      return {
        query,
        answer: "관련 정보를 찾을 수 없습니다. 다른 키워드로 검색해보세요.",
        sources: [],
        confidence: "low",
      };
    }

    // 5. Claude로 Q&A 처리
    const prompt = buildQASearchPrompt(query, meetings, contexts);
    const result = await callClaude(QA_SEARCH_PROMPT, prompt);

    return {
      query,
      ...result,
    };
  }
}
