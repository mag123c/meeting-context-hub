import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";
import { SupabaseTagRepository } from "@/storage/supabase/tag.supabase";
import { ExtractTagsUseCase } from "@/application/extract-tags.usecase";
import { NotionClient } from "@/lib/external/notion";
import { z } from "zod";

const syncNotionRequestSchema = z.object({
  pageId: z.string().min(1),
});

const searchNotionRequestSchema = z.object({
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
    const input = syncNotionRequestSchema.parse(body);

    const notionClient = new NotionClient();
    const pageContent = await notionClient.getPageContent(input.pageId);

    if (!pageContent.trim()) {
      return NextResponse.json(
        { error: "No content found in page" },
        { status: 404 }
      );
    }

    const page = await notionClient.getPage(input.pageId);
    const pageTitle = extractPageTitle(page.properties);
    const fullContent = pageTitle
      ? `# ${pageTitle}\n\n${pageContent}`
      : pageContent;

    const contextRepo = new SupabaseContextRepository(supabase);
    const tagRepo = new SupabaseTagRepository(supabase);
    const useCase = new ExtractTagsUseCase(contextRepo, tagRepo);

    await useCase.execute(user.id, {
      source: "notion",
      sourceId: input.pageId,
      content: fullContent,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to sync Notion:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("NOTION_API_KEY")) {
      return NextResponse.json(
        { error: "Notion not configured" },
        { status: 503 }
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
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter required" },
        { status: 400 }
      );
    }

    const input = searchNotionRequestSchema.parse({ query });

    const notionClient = new NotionClient();
    const pages = await notionClient.search(input.query);

    const simplifiedPages = pages.map((page) => ({
      id: page.id,
      title: extractPageTitle(page.properties),
    }));

    return NextResponse.json({ pages: simplifiedPages });
  } catch (error) {
    console.error("Failed to search Notion:", error);
    if (error instanceof Error && error.message.includes("NOTION_API_KEY")) {
      return NextResponse.json({ error: "Notion not configured" }, { status: 503 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

function extractPageTitle(properties: Record<string, unknown>): string {
  for (const [, value] of Object.entries(properties)) {
    const prop = value as {
      type?: string;
      title?: Array<{ plain_text: string }>;
    };
    if (prop.type === "title" && prop.title) {
      return prop.title.map((t) => t.plain_text).join("");
    }
  }
  return "";
}
