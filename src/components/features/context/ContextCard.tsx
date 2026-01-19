import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ContextWithTags } from "@/repositories/types";
import { Calendar, MessageSquare, FileText, Pencil, Users } from "lucide-react";

interface ContextCardProps {
  context: ContextWithTags;
}

const sourceIcons = {
  slack: MessageSquare,
  notion: FileText,
  manual: Pencil,
  meeting: Users,
};

const sourceLabels = {
  slack: "Slack",
  notion: "Notion",
  manual: "직접 입력",
  meeting: "회의",
};

export function ContextCard({ context }: ContextCardProps) {
  const date = new Date(context.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const SourceIcon = sourceIcons[context.source];

  return (
    <Link href={`/context/${context.id}`}>
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer group">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <CardTitle className="flex items-center gap-2 group-hover:text-primary transition-colors">
              <SourceIcon className="h-4 w-4 text-muted-foreground" />
              {sourceLabels[context.source]}
            </CardTitle>
            <div className="flex items-center text-xs text-muted-foreground shrink-0">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              {date}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {context.content}
          </p>

          <div className="flex items-center gap-1.5 flex-wrap">
            {context.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary">
                {tag.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
