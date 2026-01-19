import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseSprintRepository } from "@/storage/supabase/sprint.supabase";
import { z } from "zod";

const createSprintRequestSchema = z.object({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  goal: z.string().nullable().optional(),
  start_date: z.string(),
  end_date: z.string(),
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
    const input = createSprintRequestSchema.parse(body);

    const sprintRepo = new SupabaseSprintRepository(supabase);
    const sprint = await sprintRepo.create({
      ...input,
      goal: input.goal ?? null,
      status: "planning",
      retrospective: null,
    });

    return NextResponse.json(sprint, { status: 201 });
  } catch (error) {
    console.error("Failed to create sprint:", error);
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
    const projectId = searchParams.get("projectId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const sprintRepo = new SupabaseSprintRepository(supabase);

    if (projectId) {
      const result = await sprintRepo.listByProject(projectId, { page, limit });
      return NextResponse.json(result);
    }

    // Return active sprints for the user
    const activeSprints = await sprintRepo.listActive(user.id);
    return NextResponse.json({
      data: activeSprints,
      total: activeSprints.length,
      page: 1,
      limit: activeSprints.length,
      hasMore: false,
    });
  } catch (error) {
    console.error("Failed to list sprints:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
