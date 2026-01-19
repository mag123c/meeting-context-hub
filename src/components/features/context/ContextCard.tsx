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
      <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <SourceIcon className="h-4 w-4" />
              {sourceLabels[context.source]}
            </CardTitle>
            <div className="flex items-center text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 mr-1" />
              {date}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {context.content}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
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
