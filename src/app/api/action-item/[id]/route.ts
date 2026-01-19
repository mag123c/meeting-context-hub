import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseActionItemRepository } from "@/storage/supabase/action-item.supabase";
import { z } from "zod";

const updateActionItemRequestSchema = z.object({
  assignee_name: z.string().min(1).optional(),
  task: z.string().min(1).optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  deadline: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
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

    const actionItemRepo = new SupabaseActionItemRepository(supabase);
    const actionItem = await actionItemRepo.getById(id);

    if (!actionItem) {
      return NextResponse.json({ error: "Action item not found" }, { status: 404 });
    }

    return NextResponse.json(actionItem);
  } catch (error) {
    console.error("Failed to get action item:", error);
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
    const input = updateActionItemRequestSchema.parse(body);

    const actionItemRepo = new SupabaseActionItemRepository(supabase);
    const actionItem = await actionItemRepo.update(id, input);

    return NextResponse.json(actionItem);
  } catch (error) {
    console.error("Failed to update action item:", error);
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

    const actionItemRepo = new SupabaseActionItemRepository(supabase);
    await actionItemRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete action item:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
