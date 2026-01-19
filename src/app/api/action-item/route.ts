import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseActionItemRepository } from "@/storage/supabase/action-item.supabase";
import { z } from "zod";

const createActionItemRequestSchema = z.object({
  sprint_id: z.string().uuid().nullable().optional(),
  meeting_id: z.string().uuid().nullable().optional(),
  assignee_name: z.string().min(1),
  task: z.string().min(1),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  deadline: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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
    const input = createActionItemRequestSchema.parse(body);

    const actionItemRepo = new SupabaseActionItemRepository(supabase);
    const actionItem = await actionItemRepo.create({
      sprint_id: input.sprint_id ?? undefined,
      meeting_id: input.meeting_id ?? undefined,
      assignee_name: input.assignee_name,
      task: input.task,
      status: "pending",
      priority: input.priority ?? "medium",
      deadline: input.deadline ?? undefined,
      
      notes: input.notes ?? undefined,
    });

    return NextResponse.json(actionItem, { status: 201 });
  } catch (error) {
    console.error("Failed to create action item:", error);
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
    const sprintId = searchParams.get("sprintId");

    const actionItemRepo = new SupabaseActionItemRepository(supabase);

    if (sprintId) {
      const items = await actionItemRepo.listBySprint(sprintId);
      return NextResponse.json({ data: items });
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error("Failed to list action items:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
