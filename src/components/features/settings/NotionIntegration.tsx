"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

interface NotionPage {
  id: string;
  title: string;
}

export function NotionIntegration() {
  const [searchQuery, setSearchQuery] = useState("");
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [syncingPageId, setSyncingPageId] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("검색어를 입력해주세요");
      return;
    }

    setIsSearching(true);
    try {
      const url = "/api/sync/notion?query=" + encodeURIComponent(searchQuery);
      const response = await fetch(url);
      if (response.status === 503) {
        setIsConfigured(false);
        return;
      }
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      setPages(data.pages || []);
      setIsConfigured(true);
    } catch (error) {
      console.error("Failed to search Notion:", error);
      toast.error("Notion 검색에 실패했습니다");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSync = async (pageId: string) => {
    setSyncingPageId(pageId);
    try {
      const response = await fetch("/api/sync/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sync failed");
      }

      toast.success("Notion 페이지가 동기화되었습니다");
    } catch (error) {
      console.error("Failed to sync Notion:", error);
      toast.error("동기화에 실패했습니다");
    } finally {
      setSyncingPageId(null);
    }
  };

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Notion 연동
            <Badge variant="secondary">미설정</Badge>
          </CardTitle>
          <CardDescription>
            Notion 연동을 위해 환경변수를 설정해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <code>NOTION_API_KEY</code> 환경변수가 필요합니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Notion 연동
          <Badge variant="default">연결됨</Badge>
        </CardTitle>
        <CardDescription>
          Notion 페이지를 검색하고 컨텍스트로 동기화합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="페이지 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {pages.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {pages.length}개의 페이지를 찾았습니다
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center justify-between p-2 border rounded-md"
                >
                  <span className="text-sm truncate flex-1">
                    {page.title || "(제목 없음)"}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSync(page.id)}
                    disabled={syncingPageId === page.id}
                  >
                    {syncingPageId === page.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "동기화"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
