import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClaudeAdapter } from './claude.adapter.js';
import type { ExtractedContext } from '../../types/index.js';

// Mock the Anthropic SDK module
const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: mockCreate,
      };
    },
  };
});

describe('ClaudeAdapter', () => {
  let adapter: ClaudeAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new ClaudeAdapter('test-api-key');
  });

  describe('extract', () => {
    it('should extract context from input text', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: 'Test Meeting',
              summary: 'Discussion about testing',
              decisions: ['Use vitest'],
              actionItems: [{ task: 'Write tests', assignee: 'John' }],
              policies: ['TDD approach'],
              openQuestions: ['Coverage target?'],
              tags: ['testing', 'tdd'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.extract('Meeting notes about testing');

      expect(result.title).toBe('Test Meeting');
      expect(result.summary).toBe('Discussion about testing');
      expect(result.decisions).toEqual(['Use vitest']);
      expect(result.actionItems).toEqual([{ task: 'Write tests', assignee: 'John' }]);
      expect(result.policies).toEqual(['TDD approach']);
      expect(result.openQuestions).toEqual(['Coverage target?']);
      expect(result.tags).toEqual(['testing', 'tdd']);
    });

    it('should handle null assignee and dueDate from AI response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: 'Sprint Planning',
              summary: 'Planned next sprint tasks',
              decisions: ['Prioritize auth module'],
              actionItems: [
                { task: 'Implement login', assignee: null, dueDate: null },
                { task: 'Write tests', assignee: 'Alice', dueDate: null },
                { task: 'Deploy staging', assignee: null, dueDate: '2024-03-01' },
              ],
              policies: [],
              openQuestions: [],
              tags: ['sprint', 'planning'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.extract('Sprint planning notes');

      expect(result.actionItems).toHaveLength(3);
      expect(result.actionItems[0]).toEqual({ task: 'Implement login' });
      expect(result.actionItems[0].assignee).toBeUndefined();
      expect(result.actionItems[0].dueDate).toBeUndefined();
      expect(result.actionItems[1]).toEqual({ task: 'Write tests', assignee: 'Alice' });
      expect(result.actionItems[1].dueDate).toBeUndefined();
      expect(result.actionItems[2]).toEqual({ task: 'Deploy staging', dueDate: '2024-03-01' });
      expect(result.actionItems[2].assignee).toBeUndefined();
    });

    it('should pass language option to prompt', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: '테스트 미팅',
              summary: '테스트에 대한 논의',
              decisions: ['vitest 사용'],
              actionItems: [],
              policies: [],
              openQuestions: [],
              tags: ['테스트'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.extract('Meeting notes', { language: 'ko' });

      expect(result.title).toBe('테스트 미팅');
      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('Korean');
    });
  });

  describe('translate', () => {
    const mockContext: ExtractedContext = {
      title: 'API Design Meeting',
      summary: 'Discussed REST API design patterns',
      decisions: ['Use OpenAPI spec', 'Follow RESTful conventions'],
      actionItems: [
        { task: 'Create API documentation', assignee: 'Alice' },
        { task: 'Review existing endpoints', dueDate: '2024-02-01' },
      ],
      policies: ['All endpoints must be versioned', 'Use JSON responses'],
      openQuestions: ['Should we support GraphQL?', 'Rate limiting strategy?'],
      tags: ['api', 'design', 'rest'],
    };

    it('should translate context to Korean', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: 'API 설계 미팅',
              summary: 'REST API 설계 패턴에 대해 논의함',
              decisions: ['OpenAPI 스펙 사용', 'RESTful 규칙 준수'],
              actionItems: [
                { task: 'API 문서 작성', assignee: 'Alice' },
                { task: '기존 엔드포인트 검토', dueDate: '2024-02-01' },
              ],
              policies: ['모든 엔드포인트는 버전 관리 필수', 'JSON 응답 사용'],
              openQuestions: ['GraphQL을 지원해야 할까요?', '속도 제한 전략은?'],
              tags: ['api', 'design', 'rest'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.translate(mockContext, { targetLanguage: 'ko' });

      expect(result.title).toBe('API 설계 미팅');
      expect(result.summary).toBe('REST API 설계 패턴에 대해 논의함');
      expect(result.decisions).toEqual(['OpenAPI 스펙 사용', 'RESTful 규칙 준수']);
      expect(result.actionItems).toHaveLength(2);
      expect(result.actionItems[0].task).toBe('API 문서 작성');
      expect(result.actionItems[0].assignee).toBe('Alice'); // Assignee should be preserved
      expect(result.policies).toEqual(['모든 엔드포인트는 버전 관리 필수', 'JSON 응답 사용']);
      expect(result.openQuestions).toEqual(['GraphQL을 지원해야 할까요?', '속도 제한 전략은?']);
      expect(result.tags).toEqual(['api', 'design', 'rest']); // Tags preserved as-is
    });

    it('should translate context to English', async () => {
      const koreanContext: ExtractedContext = {
        title: 'API 설계 미팅',
        summary: 'REST API 설계 패턴에 대해 논의함',
        decisions: ['OpenAPI 스펙 사용'],
        actionItems: [{ task: 'API 문서 작성', assignee: '김철수' }],
        policies: ['모든 엔드포인트는 버전 관리 필수'],
        openQuestions: ['GraphQL을 지원해야 할까요?'],
        tags: ['api', '설계'],
      };

      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: 'API Design Meeting',
              summary: 'Discussed REST API design patterns',
              decisions: ['Use OpenAPI spec'],
              actionItems: [{ task: 'Create API documentation', assignee: '김철수' }],
              policies: ['All endpoints must be versioned'],
              openQuestions: ['Should we support GraphQL?'],
              tags: ['api', 'design'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.translate(koreanContext, { targetLanguage: 'en' });

      expect(result.title).toBe('API Design Meeting');
      expect(result.summary).toBe('Discussed REST API design patterns');
      expect(result.actionItems[0].assignee).toBe('김철수'); // Assignee preserved
    });

    it('should preserve technical terms in translation', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              title: 'REST API 인증 설계',
              summary: 'OAuth 2.0과 JWT를 사용한 인증 시스템 논의',
              decisions: ['OAuth 2.0 사용', 'JWT 토큰 발급'],
              actionItems: [],
              policies: ['Bearer 토큰 인증 필수'],
              openQuestions: [],
              tags: ['oauth', 'jwt', 'authentication'],
            }),
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await adapter.translate(mockContext, { targetLanguage: 'ko' });

      // Technical terms like OAuth, JWT should be preserved
      expect(mockCreate).toHaveBeenCalled();
      const callArgs = mockCreate.mock.calls[0][0];
      expect(callArgs.messages[0].content).toContain('technical terms');
      expect(result).toBeDefined();
    });

    it('should handle API errors gracefully', async () => {
      mockCreate.mockRejectedValue(new Error('API rate limit exceeded'));

      await expect(adapter.translate(mockContext, { targetLanguage: 'ko' })).rejects.toThrow(
        'Failed to translate context'
      );
    });

    it('should handle invalid JSON response', async () => {
      const mockResponse = {
        content: [
          {
            type: 'text',
            text: 'This is not valid JSON',
          },
        ],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(adapter.translate(mockContext, { targetLanguage: 'ko' })).rejects.toThrow();
    });

    it('should handle empty response', async () => {
      const mockResponse = {
        content: [],
      };

      mockCreate.mockResolvedValue(mockResponse);

      await expect(adapter.translate(mockContext, { targetLanguage: 'ko' })).rejects.toThrow(
        'No text response from Claude'
      );
    });
  });
});
