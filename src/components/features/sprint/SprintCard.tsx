import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprint } from "@/repositories/types";
import { Calendar, Target, CheckCircle2 } from "lucide-react";

interface SprintCardProps {
  sprint: Sprint;
  meetingCount?: number;
  actionItemCount?: number;
}

const statusColors: Record<string, string> = {
  planning: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  planning: "계획 중",
  active: "진행 중",
  completed: "완료",
  cancelled: "취소됨",
};

export function SprintCard({ sprint, meetingCount = 0, actionItemCount = 0 }: SprintCardProps) {
  const startDate = new Date(sprint.start_date).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });
  const endDate = new Date(sprint.end_date).toLocaleDateString("ko-KR", {
    month: "short",
    day: "numeric",
  });

  return (
    <Link href={`/sprints/${sprint.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-1">{sprint.name}</CardTitle>
            <Badge variant="outline" className={statusColors[sprint.status]}>
              {statusLabels[sprint.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {sprint.goal && (
            <div className="flex items-start gap-2 mb-3">
              <Target className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {sprint.goal}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              {startDate} - {endDate}
            </div>

            <div className="flex items-center gap-3">
              {meetingCount > 0 && (
                <span className="text-muted-foreground">
                  {meetingCount} 회의
                </span>
              )}
              {actionItemCount > 0 && (
                <span className="flex items-center text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                  {actionItemCount}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
