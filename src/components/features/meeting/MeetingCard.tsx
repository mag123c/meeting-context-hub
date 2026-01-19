import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MeetingWithTags } from "@/repositories/types";
import { Calendar, FileText } from "lucide-react";

interface MeetingCardProps {
  meeting: MeetingWithTags;
}

export function MeetingCard({ meeting }: MeetingCardProps) {
  const date = new Date(meeting.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Link href={`/meeting/${meeting.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
              {meeting.title}
            </CardTitle>
            <div className="flex items-center text-xs text-muted-foreground shrink-0">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {date}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {meeting.prd_summary && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {meeting.prd_summary.problem}
            </p>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {meeting.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}

            {meeting.action_items && meeting.action_items.length > 0 && (
              <Badge variant="outline" className="ml-auto">
                <FileText className="h-3 w-3 mr-1" />
                {meeting.action_items.length} 액션
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
