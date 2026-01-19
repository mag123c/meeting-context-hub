"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, AlertCircle, CheckCircle, HelpCircle, ExternalLink } from "lucide-react";
import type { SearchResult } from "@/application/search-context.usecase";

const confidenceConfig = {
  high: { icon: CheckCircle, color: "text-success", label: "높음" },
  medium: { icon: AlertCircle, color: "text-warning", label: "보통" },
  low: { icon: HelpCircle, color: "text-destructive", label: "낮음" },
};

export function SearchForm() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to search");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  const getSourceLink = (source: { type: "meeting" | "context"; id: string }) => {
    return source.type === "meeting" ? "/meeting/" + source.id : "/context/" + source.id;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Q&A 검색</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              placeholder="예: 프로젝트 X 어디까지 했지?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">답변</CardTitle>
              <Badge variant="outline" className="flex items-center gap-1">
                {(() => {
                  const config = confidenceConfig[result.confidence];
                  const Icon = config.icon;
                  return (
                    <>
                      <Icon className={"h-3 w-3 " + config.color} />
                      신뢰도: {config.label}
                    </>
                  );
                })()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm whitespace-pre-wrap text-foreground">{result.answer}</p>

            {result.sources.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-primary mb-2">
                  출처
                </h4>
                <ul className="space-y-2">
                  {result.sources.map((source, i) => (
                    <li key={i} className="text-sm">
                      <Link
                        href={getSourceLink(source)}
                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                      >
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {source.type === "meeting" ? "회의록" : "컨텍스트"}
                        </Badge>
                        <span className="text-muted-foreground flex-1">
                          {source.relevance}
                        </span>
                        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
