import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/storage/supabase/server";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";
import { Navbar } from "@/components/layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, FileText, MessageSquare, Pencil, Users } from "lucide-react";

interface ContextDetailPageProps {
  params: Promise<{ id: string }>;
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

export default async function ContextDetailPage({ params }: ContextDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const contextRepo = new SupabaseContextRepository(supabase);
  const context = await contextRepo.getById(id);

  if (!context || context.user_id !== user.id) {
    notFound();
  }

  const date = new Date(context.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const SourceIcon = sourceIcons[context.source];

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-4xl py-8">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            목록으로
          </Button>
        </Link>

        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <SourceIcon className="h-6 w-6" />
              {sourceLabels[context.source]} 컨텍스트
            </h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {date}
              </span>
              {context.obsidian_path && (
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {context.obsidian_path}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-3">
              {context.tags.map((tag) => (
                <Badge key={tag.id} variant="secondary">
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>내용</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{context.content}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
