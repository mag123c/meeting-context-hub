import { Navbar } from "@/components/layout";
import { SearchForm } from "@/components/features/search";

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <header className="mb-8">
          <h1 className="font-serif text-2xl font-semibold tracking-tight">검색</h1>
          <p className="text-muted-foreground mt-1">회의록과 컨텍스트에서 원하는 정보를 찾아보세요</p>
        </header>
        <SearchForm />
      </main>
    </div>
  );
}
