import type { Prompt } from "../../types/prompt.types.js";
import type { HierarchyCache } from "../../types/hierarchy.types.js";

/**
 * Build hierarchy context string for AI prompt
 */
export function buildHierarchyContext(cache: HierarchyCache): string {
  if (cache.projects.length === 0) {
    return "현재 계층 구조가 비어있습니다. 새 프로젝트/카테고리를 생성해도 됩니다.";
  }

  const lines = cache.projects.map((proj) => {
    const categories = proj.categories.length > 0
      ? proj.categories.join(", ")
      : "(카테고리 없음)";
    return `- ${proj.name}: [${categories}]`;
  });

  return `현재 계층 구조:\n${lines.join("\n")}`;
}

interface HierarchyClassificationInput {
  content: string;
  hierarchyContext: string;
  tags: string[];
  contextType: string;
}

export const hierarchyClassificationPrompt: Prompt = {
  version: "1.0.0",
  name: "hierarchy-classification",
  description: "컨텍스트를 프로젝트/카테고리 계층에 자동 분류합니다",
  system: `당신은 컨텍스트 분류 전문가입니다.
주어진 내용을 분석하고 적절한 프로젝트와 카테고리에 배치하세요.

규칙:
1. 기존 계층 구조가 있으면 최대한 활용 (일관성 유지)
2. 명확한 프로젝트가 있으면 해당 프로젝트 선택
3. 프로젝트 내 카테고리는 "Meeting", "Backend", "Frontend", "Design", "General" 등 업무 유형으로 구분
4. 새 프로젝트/카테고리가 필요한 경우에만 생성
5. 확실하지 않으면 "Uncategorized" 프로젝트 사용
6. 반드시 JSON 형식으로만 응답`,
  template: (inputJson: string) => {
    const input: HierarchyClassificationInput = JSON.parse(inputJson);
    const contentPreview = input.content.slice(0, 1000) + (input.content.length > 1000 ? "..." : "");
    const tagsText = input.tags.join(", ") || "없음";

    return `${input.hierarchyContext}

분류할 내용:
---
${contentPreview}
---

추가 정보:
- 태그: ${tagsText}
- 타입: ${input.contextType}

위 내용을 적절한 프로젝트/카테고리에 배치하세요.

응답 형식 (JSON만):
{
  "project": "프로젝트명",
  "category": "카테고리명",
  "isNewProject": false,
  "isNewCategory": false,
  "confidence": 0.85
}

참고:
- project: 기존 프로젝트명 또는 새 프로젝트명 (확실하지 않으면 "Uncategorized")
- category: 기존 카테고리명 또는 새 카테고리명 (기본값: "General")
- isNewProject: 새 프로젝트면 true
- isNewCategory: 기존 프로젝트 내 새 카테고리면 true
- confidence: 분류 확신도 (0-1)`;
  },
};
