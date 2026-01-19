import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseSprintRepository } from "@/storage/supabase/sprint.supabase";
import { z } from "zod";

const updateSprintRequestSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().nullable().optional(),
  status: z.enum(["planning", "active", "completed", "cancelled"]).optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  retrospective: z.string().nullable().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sprintRepo = new SupabaseSprintRepository(supabase);
    const sprint = await sprintRepo.getById(id);

    if (!sprint) {
      return NextResponse.json({ error: "Sprint not found" }, { status: 404 });
    }

    return NextResponse.json(sprint);
  } catch (error) {
    console.error("Failed to get sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const input = updateSprintRequestSchema.parse(body);

    const sprintRepo = new SupabaseSprintRepository(supabase);
    const sprint = await sprintRepo.update(id, input);

    return NextResponse.json(sprint);
  } catch (error) {
    console.error("Failed to update sprint:", error);
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sprintRepo = new SupabaseSprintRepository(supabase);
    await sprintRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete sprint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
