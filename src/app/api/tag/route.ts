import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseTagRepository } from "@/storage/supabase/tag.supabase";
import { z } from "zod";

const createTagRequestSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().optional(),
});

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tagRepo = new SupabaseTagRepository(supabase);
    const tags = await tagRepo.list();

    return NextResponse.json({ data: tags });
  } catch (error) {
    console.error("Failed to list tags:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
    const input = createTagRequestSchema.parse(body);

    const tagRepo = new SupabaseTagRepository(supabase);
    
    // Check if tag with same name already exists
    const existingTag = await tagRepo.getByName(input.name);
    if (existingTag) {
      return NextResponse.json(existingTag);
    }

    const tag = await tagRepo.create(input);

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Failed to create tag:", error);
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
