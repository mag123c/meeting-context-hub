import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseMeetingRepository } from "@/storage/supabase/meeting.supabase";
import { SupabaseTagRepository } from "@/storage/supabase/tag.supabase";
import { SummarizeMeetingUseCase } from "@/application/summarize-meeting.usecase";
import { z } from "zod";

const createMeetingRequestSchema = z.object({
  title: z.string().min(1),
  rawContent: z.string().min(1),
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
    const input = createMeetingRequestSchema.parse(body);

    const meetingRepo = new SupabaseMeetingRepository(supabase);
    const tagRepo = new SupabaseTagRepository(supabase);
    const useCase = new SummarizeMeetingUseCase(meetingRepo, tagRepo);

    const meeting = await useCase.execute(user.id, input);

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Failed to create meeting:", error);
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

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const meetingRepo = new SupabaseMeetingRepository(supabase);
    const result = await meetingRepo.listByUser(user.id, { page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list meetings:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
