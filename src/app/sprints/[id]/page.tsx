import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/storage/supabase/server";
import { SupabaseSprintRepository } from "@/storage/supabase/sprint.supabase";
import { SupabaseMeetingRepository } from "@/storage/supabase/meeting.supabase";
import { SupabaseActionItemRepository } from "@/storage/supabase/action-item.supabase";
import { Navbar } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeetingCard } from "@/components/features/meeting";
import {
  ArrowLeft,
  Calendar,
  Target,
  Zap,
  FileText,
  CheckSquare,
} from "lucide-react";
import { SprintStatusControl } from "./SprintStatusControl";
import { ActionItemsSection } from "./ActionItemsSection";

interface SprintDetailPageProps {
  params: Promise<{ id: string }>;
}

const statusConfig: Record<string, { label: string; variant: "warning" | "success" | "default" | "destructive" }> = {
  planning: { label: "계획 중", variant: "warning" },
  active: { label: "진행 중", variant: "success" },
  completed: { label: "완료", variant: "default" },
  cancelled: { label: "취소됨", variant: "destructive" },
};

export default async function SprintDetailPage({ params }: SprintDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sprintRepo = new SupabaseSprintRepository(supabase);
  const meetingRepo = new SupabaseMeetingRepository(supabase);
  const actionItemRepo = new SupabaseActionItemRepository(supabase);

  const sprint = await sprintRepo.getById(id);

  if (!sprint) {
    notFound();
  }

  // Fetch related data
  const [meetingsResult, actionItemsResult] = await Promise.all([
    meetingRepo.listByUser(user.id, { page: 1, limit: 50 }),
    actionItemRepo.listBySprint(id),
  ]);

  // Filter meetings by sprint
  const sprintMeetings = meetingsResult.data.filter(
    (m) => m.sprint_id === id
  );

  const actionItems = actionItemsResult.data;

  const startDate = new Date(sprint.start_date).toLocaleDateString("ko-KR");
  const endDate = new Date(sprint.end_date).toLocaleDateString("ko-KR");

  const completedItems = actionItems.filter((item) => item.status === "completed").length;
  const totalItems = actionItems.length;

  const statusInfo = statusConfig[sprint.status] || statusConfig.planning;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-4xl py-8">
        <div className="flex items-center justify-between mb-6">
          <Link href="/sprints">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              스프린트 목록
            </Button>
          </Link>
          <SprintStatusControl sprintId={sprint.id} currentStatus={sprint.status} />
        </div>

        <article className="space-y-6">
          {/* Header */}
          <header>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="font-serif text-2xl font-semibold tracking-tight">{sprint.name}</h1>
              <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {startDate} - {endDate}
              </span>
            </div>
          </header>

          {/* Goal */}
          {sprint.goal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-primary flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  스프린트 목표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed">{sprint.goal}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-semibold">{sprintMeetings.length}</p>
                    <p className="text-xs text-muted-foreground">회의록</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-semibold">
                      {completedItems}/{totalItems}
                    </p>
                    <p className="text-xs text-muted-foreground">완료된 액션아이템</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-5">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-semibold">
                      {totalItems > 0
                        ? Math.round((completedItems / totalItems) * 100)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">진행률</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Items */}
          <ActionItemsSection 
            actionItems={actionItems} 
            sprintId={sprint.id} 
          />

          {/* Meetings */}
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              회의록
            </h2>
            {sprintMeetings.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    이 스프린트에 연결된 회의록이 없습니다
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {sprintMeetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </section>

          {/* Retrospective */}
          {sprint.retrospective && (
            <Card>
              <CardHeader>
                <CardTitle>회고</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{sprint.retrospective}</p>
              </CardContent>
            </Card>
          )}
        </article>
      </main>
    </div>
  );
}
