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
  project?: string; // 프로젝트 이름
  sprint?: string; // 스프린트 식별자
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateContextInput {
  type: ContextType;
  content: string;
  source?: string;
  tags?: string[]; // 이미지 분석 시 미리 추출된 태그
  project?: string; // 프로젝트 이름
  sprint?: string; // 스프린트 식별자
}

export interface ContextWithSimilarity extends Context {
  similarity: number;
}

export interface ListOptions {
  tags?: string[];
  type?: ContextType;
  project?: string; // 프로젝트 필터
  sprint?: string; // 스프린트 필터
  limit?: number;
  offset?: number;
}
