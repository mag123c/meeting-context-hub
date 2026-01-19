import type { SupabaseClient } from "@supabase/supabase-js";
import {
  SupabaseMeetingRepository,
  SupabaseContextRepository,
  SupabaseTagRepository,
  SupabaseSprintRepository,
  SupabaseProjectRepository,
  SupabaseSquadRepository,
  SupabaseActionItemRepository,
} from "@/storage/supabase";
import { SummarizeMeetingUseCase } from "./summarize-meeting.usecase";
import { ExtractTagsUseCase } from "./extract-tags.usecase";
import { SearchContextUseCase } from "./search-context.usecase";

/**
 * Repository Factory
 * Supabase 클라이언트를 받아 모든 Repository 인스턴스 생성
 */
export function createRepositories(supabase: SupabaseClient) {
  return {
    meeting: new SupabaseMeetingRepository(supabase),
    context: new SupabaseContextRepository(supabase),
    tag: new SupabaseTagRepository(supabase),
    sprint: new SupabaseSprintRepository(supabase),
    project: new SupabaseProjectRepository(supabase),
    squad: new SupabaseSquadRepository(supabase),
    actionItem: new SupabaseActionItemRepository(supabase),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

/**
 * UseCase Factory
 * Repository를 주입받아 모든 UseCase 인스턴스 생성
 */
export function createUseCases(repos: Repositories) {
  return {
    summarizeMeeting: new SummarizeMeetingUseCase(repos.meeting, repos.tag),
    extractTags: new ExtractTagsUseCase(repos.context, repos.tag),
    searchContext: new SearchContextUseCase(repos.meeting, repos.context),
  };
}

export type UseCases = ReturnType<typeof createUseCases>;

/**
 * 통합 Factory
 * Supabase 클라이언트 하나로 모든 Repository와 UseCase 생성
 */
export function createApplicationContext(supabase: SupabaseClient) {
  const repositories = createRepositories(supabase);
  const useCases = createUseCases(repositories);

  return {
    repositories,
    useCases,
  };
}

export type ApplicationContext = ReturnType<typeof createApplicationContext>;
