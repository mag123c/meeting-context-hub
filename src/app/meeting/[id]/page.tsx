import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/storage/supabase/server";
import { SupabaseMeetingRepository } from "@/storage/supabase/meeting.supabase";
import { Navbar } from "@/components/layout";
import { PRDSummary, ActionItemList } from "@/components/features/meeting";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import { MeetingActions } from "./MeetingActions";

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const meetingRepo = new SupabaseMeetingRepository(supabase);
  const meeting = await meetingRepo.getById(id);

  if (!meeting || meeting.user_id !== user.id) {
    notFound();
  }

  const date = new Date(meeting.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-4">
          <Link href="/">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              목록으로
            </Button>
          </Link>
          <MeetingActions meeting={meeting} />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">{meeting.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
              {meeting.obsidian_path && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {meeting.obsidian_path}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              {meeting.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          {meeting.prd_summary && <PRDSummary prd={meeting.prd_summary} />}

          {meeting.action_items && meeting.action_items.length > 0 && (
            <ActionItemList items={meeting.action_items} />
          )}

          <Card>
            <CardHeader>
              <CardTitle>원본 회의록</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-wrap font-mono bg-muted p-4 rounded-lg">
                {meeting.raw_content}
              </pre>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
