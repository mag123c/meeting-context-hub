import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";
import { SupabaseTagRepository } from "@/storage/supabase/tag.supabase";
import { ExtractTagsUseCase } from "@/application/extract-tags.usecase";
import { contextSourceSchema } from "@/repositories/types";
import { z } from "zod";

const createContextRequestSchema = z.object({
  source: contextSourceSchema,
  sourceId: z.string().optional(),
  content: z.string().min(1),
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
    const input = createContextRequestSchema.parse(body);

    const contextRepo = new SupabaseContextRepository(supabase);
    const tagRepo = new SupabaseTagRepository(supabase);
    const useCase = new ExtractTagsUseCase(contextRepo, tagRepo);

    const context = await useCase.execute(user.id, input);

    return NextResponse.json(context, { status: 201 });
  } catch (error) {
    console.error("Failed to create context:", error);
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
    const source = searchParams.get("source");

    const contextRepo = new SupabaseContextRepository(supabase);

    let result;
    if (source && contextSourceSchema.safeParse(source).success) {
      result = await contextRepo.listBySource(
        user.id,
        source as "slack" | "notion" | "manual" | "meeting",
        { page, limit }
      );
    } else {
      result = await contextRepo.listByUser(user.id, { page, limit });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Failed to list contexts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
