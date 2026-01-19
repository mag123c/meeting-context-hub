import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/storage/supabase/server";
import { SupabaseSprintRepository } from "@/storage/supabase/sprint.supabase";
import { SupabaseProjectRepository } from "@/storage/supabase/project.supabase";
import { SprintCard } from "@/components/features/sprint";
import { Navbar } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Zap, FolderKanban } from "lucide-react";

export default async function SprintsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const sprintRepo = new SupabaseSprintRepository(supabase);
  const projectRepo = new SupabaseProjectRepository(supabase);

  const [activeSprints, projectsResult] = await Promise.all([
    sprintRepo.listActive(user.id),
    projectRepo.listByUser(user.id, { page: 1, limit: 50 }),
  ]);

  const hasProjects = projectsResult.data.length > 0;

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container py-8">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-semibold tracking-tight">스프린트</h1>
            <p className="text-muted-foreground mt-1">팀의 작업 주기를 관리하세요</p>
          </div>
          {hasProjects && (
            <Link href="/sprints/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                새 스프린트
              </Button>
            </Link>
          )}
        </header>

        {!hasProjects ? (
          <Card className="text-center py-16">
            <CardContent>
              <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-lg font-medium mb-2">프로젝트가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-6">
                스프린트를 생성하려면 먼저 프로젝트를 만들어야 합니다
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  프로젝트 만들기
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : activeSprints.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <Zap className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="font-serif text-lg font-medium mb-2">활성 스프린트가 없습니다</h3>
              <p className="text-sm text-muted-foreground mb-6">
                새 스프린트를 생성하여 작업을 시작하세요
              </p>
              <Link href="/sprints/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  스프린트 생성
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              진행 중인 스프린트
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {activeSprints.map((sprint) => (
                <SprintCard key={sprint.id} sprint={sprint} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
