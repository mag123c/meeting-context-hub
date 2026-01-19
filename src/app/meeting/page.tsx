import { Navbar } from "@/components/layout";
import { MeetingForm } from "@/components/features/meeting";

export default function NewMeetingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">새 회의록 등록</h1>
          <p className="text-muted-foreground mt-1">회의 내용을 입력하면 AI가 자동으로 요약합니다</p>
        </header>
        <MeetingForm />
      </main>
    </div>
  );
}
