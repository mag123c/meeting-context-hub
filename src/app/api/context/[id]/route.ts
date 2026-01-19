import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const contextRepo = new SupabaseContextRepository(supabase);
    const context = await contextRepo.getById(id);

    if (!context) {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }

    if (context.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(context);
  } catch (error) {
    console.error("Failed to get context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const contextRepo = new SupabaseContextRepository(supabase);
    const context = await contextRepo.getById(id);

    if (!context) {
      return NextResponse.json({ error: "Context not found" }, { status: 404 });
    }

    if (context.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await contextRepo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete context:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
