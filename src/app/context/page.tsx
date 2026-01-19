import { ContextForm } from "@/components/features/context";

export default function NewContextPage() {
  return (
    <div className="container max-w-3xl py-8">
      <h1 className="text-2xl font-bold mb-6">새 컨텍스트 등록</h1>
      <ContextForm />
    </div>
  );
}
