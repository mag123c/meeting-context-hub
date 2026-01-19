import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/storage/supabase/server";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";
import { SupabaseTagRepository } from "@/storage/supabase/tag.supabase";
import { ExtractTagsUseCase } from "@/application/extract-tags.usecase";
import { SlackClient } from "@/lib/external/slack";
import { z } from "zod";

const syncSlackRequestSchema = z.object({
  channelId: z.string().min(1),
  limit: z.number().min(1).max(100).optional().default(50),
});

// POST: Slack 채널 메시지를 Context로 동기화
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
    const input = syncSlackRequestSchema.parse(body);

    const slackClient = new SlackClient();

    // Slack 메시지 가져오기 및 포맷팅
    const formattedContent = await slackClient.formatMessagesForContext(
      input.channelId,
      input.limit
    );

    if (!formattedContent.trim()) {
      return NextResponse.json(
        { error: "No messages found in channel" },
        { status: 404 }
      );
    }

    // Context로 저장 (ExtractTagsUseCase 재사용)
    const contextRepo = new SupabaseContextRepository(supabase);
    const tagRepo = new SupabaseTagRepository(supabase);
    const useCase = new ExtractTagsUseCase(contextRepo, tagRepo);

    await useCase.execute(user.id, {
      source: "slack",
      sourceId: input.channelId,
      content: formattedContent,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Failed to sync Slack:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message.includes("SLACK_BOT_TOKEN")) {
      return NextResponse.json(
        { error: "Slack not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET: Slack 채널 목록 조회
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const slackClient = new SlackClient();
    const channels = await slackClient.listChannels();

    return NextResponse.json({ channels });
  } catch (error) {
    console.error("Failed to list Slack channels:", error);
    if (error instanceof Error && error.message.includes("SLACK_BOT_TOKEN")) {
      return NextResponse.json(
        { error: "Slack not configured" },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
