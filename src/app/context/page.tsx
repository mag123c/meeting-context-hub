import { Navbar } from "@/components/layout";
import { ContextForm } from "@/components/features/context";

export default function NewContextPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">새 컨텍스트 등록</h1>
          <p className="text-muted-foreground mt-1">프로젝트 관련 정보를 등록하고 자동 태깅을 받아보세요</p>
        </header>
        <ContextForm />
      </main>
    </div>
  );
}
