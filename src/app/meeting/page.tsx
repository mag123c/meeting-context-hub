import { Navbar } from "@/components/layout";
import { MeetingForm } from "@/components/features/meeting";

export default function NewMeetingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <h1 className="text-2xl font-bold mb-6">새 회의록 등록</h1>
        <MeetingForm />
      </main>
    </div>
  );
}
