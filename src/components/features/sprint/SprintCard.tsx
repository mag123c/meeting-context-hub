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

const statusConfig: Record<string, { variant: "warning" | "success" | "default" | "destructive"; label: string }> = {
  planning: { variant: "warning", label: "계획 중" },
  active: { variant: "success", label: "진행 중" },
  completed: { variant: "default", label: "완료" },
  cancelled: { variant: "destructive", label: "취소됨" },
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

  const config = statusConfig[sprint.status] || statusConfig.planning;

  return (
    <Link href={`/sprints/${sprint.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
              {sprint.name}
            </CardTitle>
            <Badge variant={config.variant}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sprint.goal && (
            <div className="flex items-start gap-2">
              <Target className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-muted-foreground line-clamp-2">
                {sprint.goal}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {startDate} - {endDate}
            </div>

            <div className="flex items-center gap-3 text-muted-foreground">
              {meetingCount > 0 && (
                <span>{meetingCount} 회의</span>
              )}
              {actionItemCount > 0 && (
                <span className="flex items-center">
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
