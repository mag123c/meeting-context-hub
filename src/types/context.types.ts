/**
 * Context entity types
 */

export type ContextType = "text" | "image" | "audio" | "file";

export interface Context {
  id: string;
  type: ContextType;
  content: string;
  summary: string;
  tags: string[];
  embedding?: number[];
  source?: string; // 원본 파일 경로 (image, audio, file)
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContextInput {
  type: ContextType;
  content: string;
  source?: string;
  tags?: string[]; // 이미지 분석 시 미리 추출된 태그
}

export interface ContextWithSimilarity extends Context {
  similarity: number;
}

export interface ListOptions {
  tags?: string[];
  type?: ContextType;
  limit?: number;
  offset?: number;
}
