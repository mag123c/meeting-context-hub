import { Navbar } from "@/components/layout";
import { SearchForm } from "@/components/features/search";

export default function SearchPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container max-w-3xl py-8">
        <h1 className="text-2xl font-bold mb-6">검색</h1>
        <SearchForm />
      </main>
    </div>
  );
}
