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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { FileText, MessageSquare, Plus } from "lucide-react";

interface DashboardPageProps {
  searchParams: Promise<{ page?: string; tab?: string }>;
}

const ITEMS_PER_PAGE = 10;

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const currentPage = Math.max(1, parseInt(params.page || "1"));
  const currentTab = params.tab || "meetings";

  const meetingRepo = new SupabaseMeetingRepository(supabase);
  const contextRepo = new SupabaseContextRepository(supabase);

  const [meetingsResult, contextsResult] = await Promise.all([
    meetingRepo.listByUser(user.id, { page: currentTab === "meetings" ? currentPage : 1, limit: ITEMS_PER_PAGE }),
    contextRepo.listByUser(user.id, { page: currentTab === "contexts" ? currentPage : 1, limit: ITEMS_PER_PAGE }),
  ]);

  const currentResult = currentTab === "meetings" ? meetingsResult : contextsResult;
  const totalPages = Math.ceil(currentResult.total / ITEMS_PER_PAGE);

  const buildPageUrl = (page: number, tab: string) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("tab", tab);
    return "/?" + params.toString();
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">대시보드</h1>
        </div>

        <Tabs defaultValue={currentTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="meetings" asChild>
              <Link href={buildPageUrl(1, "meetings")} className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                회의록
                <span className="ml-1 text-xs text-muted-foreground">
                  ({meetingsResult.total})
                </span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="contexts" asChild>
              <Link href={buildPageUrl(1, "contexts")} className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                컨텍스트
                <span className="ml-1 text-xs text-muted-foreground">
                  ({contextsResult.total})
                </span>
              </Link>
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
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {meetingsResult.data.map((meeting) => (
                    <MeetingCard key={meeting.id} meeting={meeting} />
                  ))}
                </div>
                {totalPages > 1 && currentTab === "meetings" && (
                  <PaginationNav
                    currentPage={currentPage}
                    totalPages={totalPages}
                    tab="meetings"
                    buildPageUrl={buildPageUrl}
                  />
                )}
              </>
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
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  {contextsResult.data.map((context) => (
                    <ContextCard key={context.id} context={context} />
                  ))}
                </div>
                {totalPages > 1 && currentTab === "contexts" && (
                  <PaginationNav
                    currentPage={currentPage}
                    totalPages={totalPages}
                    tab="contexts"
                    buildPageUrl={buildPageUrl}
                  />
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

interface PaginationNavProps {
  currentPage: number;
  totalPages: number;
  tab: string;
  buildPageUrl: (page: number, tab: string) => string;
}

function PaginationNav({ currentPage, totalPages, tab, buildPageUrl }: PaginationNavProps) {
  // Generate visible page numbers
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? buildPageUrl(currentPage - 1, tab) : "#"}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
        
        {getPageNumbers().map((page) => (
          <PaginationItem key={page}>
            <PaginationLink
              href={buildPageUrl(page, tab)}
              isActive={page === currentPage}
            >
              {page}
            </PaginationLink>
          </PaginationItem>
        ))}
        
        <PaginationItem>
          <PaginationNext
            href={currentPage < totalPages ? buildPageUrl(currentPage + 1, tab) : "#"}
            aria-disabled={currentPage >= totalPages}
            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
