import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/storage/supabase/server";
import { SupabaseMeetingRepository } from "@/storage/supabase/meeting.supabase";
import { SupabaseContextRepository } from "@/storage/supabase/context.supabase";
import { MeetingCard } from "@/components/features/meeting";
import { ContextCard } from "@/components/features/context";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, MessageSquare, Plus } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meetingRepo = new SupabaseMeetingRepository(supabase);
  const contextRepo = new SupabaseContextRepository(supabase);

  const [meetingsResult, contextsResult] = await Promise.all([
    meetingRepo.listByUser(user.id, { page: 1, limit: 10 }),
    contextRepo.listByUser(user.id, { page: 1, limit: 10 }),
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">대시보드</h1>
        </div>

        <Tabs defaultValue="meetings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              회의록
              <span className="ml-1 text-xs text-muted-foreground">
                ({meetingsResult.total})
              </span>
            </TabsTrigger>
            <TabsTrigger value="contexts" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              컨텍스트
              <span className="ml-1 text-xs text-muted-foreground">
                ({contextsResult.total})
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-4">
            {meetingsResult.data.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">회의록이 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  첫 번째 회의록을 등록하고 AI 요약을 받아보세요
                </p>
                <Link href="/meeting">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    회의록 등록
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {meetingsResult.data.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contexts" className="space-y-4">
            {contextsResult.data.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">컨텍스트가 없습니다</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  프로젝트 관련 정보를 등록하고 자동 태깅을 받아보세요
                </p>
                <Link href="/context">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    컨텍스트 등록
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {contextsResult.data.map((context) => (
                  <ContextCard key={context.id} context={context} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
