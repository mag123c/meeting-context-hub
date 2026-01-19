import { redirect } from "next/navigation";
import { createClient } from "@/storage/supabase/server";
import { SupabaseProjectRepository } from "@/storage/supabase/project.supabase";
import { Navbar } from "@/components/layout";
import { NewSprintForm } from "./NewSprintForm";

export default async function NewSprintPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const projectRepo = new SupabaseProjectRepository(supabase);
  const projectsResult = await projectRepo.listByUser(user.id, { page: 1, limit: 50 });

  if (projectsResult.data.length === 0) {
    redirect("/projects/new");
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-2xl py-8">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">새 스프린트 생성</h1>
          <p className="text-muted-foreground mt-1">프로젝트의 작업 주기를 설정하세요</p>
        </header>
        <NewSprintForm projects={projectsResult.data} />
      </main>
    </div>
  );
}
