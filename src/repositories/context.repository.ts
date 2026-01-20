import type { Context, ListOptions, ContextWithSimilarity } from "../types/context.types.js";

/**
 * Context Repository Interface
 * Infrastructure Layer에서 구현체 제공
 */
export interface ContextRepository {
  /**
   * Context를 저장하고 ID를 반환합니다.
   */
  save(context: Context): Promise<string>;

  /**
   * ID로 Context를 조회합니다.
   */
  findById(id: string): Promise<Context | null>;

  /**
   * 태그로 Context를 조회합니다.
   */
  findByTags(tags: string[]): Promise<Context[]>;

  /**
   * 임베딩 유사도로 Context를 검색합니다.
   */
  findSimilar(embedding: number[], limit?: number): Promise<ContextWithSimilarity[]>;

  /**
   * 모든 Context를 조회합니다.
   */
  findAll(options?: ListOptions): Promise<Context[]>;

  /**
   * Context를 삭제합니다.
   */
  delete(id: string): Promise<void>;

  /**
   * Context의 태그를 업데이트합니다.
   */
  updateTags(id: string, tags: string[]): Promise<void>;

  /**
   * Context의 임베딩을 업데이트합니다.
   */
  updateEmbedding(id: string, embedding: number[]): Promise<void>;
}
