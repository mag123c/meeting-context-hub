import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseMeetingRepository } from "@/storage/supabase/meeting.supabase";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";
import { SearchContextUseCase } from "@/application/search-context.usecase";
import { z } from "zod";

const searchRequestSchema = z.object({
  query: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { query } = searchRequestSchema.parse(body);

    const meetingRepo = new SupabaseMeetingRepository(supabase);
    const contextRepo = new SupabaseContextRepository(supabase);
    const useCase = new SearchContextUseCase(meetingRepo, contextRepo);

    const result = await useCase.execute(user.id, query);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to search:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
