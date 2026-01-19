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
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-1">{meeting.title}</CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              {date}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {meeting.prd_summary && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {meeting.prd_summary.problem}
            </p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
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
