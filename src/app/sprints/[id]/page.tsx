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

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planning: { label: "계획 중", variant: "outline" },
  active: { label: "진행 중", variant: "default" },
  completed: { label: "완료", variant: "secondary" },
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

  const statusInfo = statusLabels[sprint.status] || statusLabels.planning;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-4xl py-8">
        <Link href="/sprints">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            스프린트 목록
          </Button>
        </Link>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold">{sprint.name}</h1>
                <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {startDate} - {endDate}
                </span>
              </div>
            </div>
            <SprintStatusControl sprintId={sprint.id} currentStatus={sprint.status} />
          </div>

          {/* Goal */}
          {sprint.goal && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  스프린트 목표
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{sprint.goal}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{sprintMeetings.length}</p>
                    <p className="text-xs text-muted-foreground">회의록</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">
                      {completedItems}/{totalItems}
                    </p>
                    <p className="text-xs text-muted-foreground">완료된 액션아이템</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                회의록
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sprintMeetings.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  이 스프린트에 연결된 회의록이 없습니다
                </p>
              ) : (
                <div className="space-y-4">
                  {sprintMeetings.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retrospective */}
          {sprint.retrospective && (
            <Card>
              <CardHeader>
                <CardTitle>회고</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{sprint.retrospective}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
