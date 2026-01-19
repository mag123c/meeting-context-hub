"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ActionItem, ActionItemPriority } from "@/repositories/types/action-item.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckSquare, Calendar, User } from "lucide-react";
import { toast } from "sonner";

interface ActionItemsSectionProps {
  actionItems: ActionItem[];
  sprintId: string;
}

const priorityColors: Record<ActionItemPriority, string> = {
  low: "bg-slate-500",
  medium: "bg-blue-500",
  high: "bg-orange-500",
  urgent: "bg-red-500",
};

const priorityLabels: Record<ActionItemPriority, string> = {
  low: "낮음",
  medium: "보통",
  high: "높음",
  urgent: "긴급",
};

export function ActionItemsSection({ actionItems, sprintId: _sprintId }: ActionItemsSectionProps) {
  const router = useRouter();
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());

  const handleToggle = async (item: ActionItem) => {
    const newStatus = item.status === "completed" ? "pending" : "completed";
    
    setLoadingItems((prev) => new Set(prev).add(item.id));
    
    try {
      const res = await fetch("/api/action-item/" + item.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          completed_at: newStatus === "completed" ? new Date().toISOString() : null,
        }),
      });

      if (!res.ok) {
        throw new Error("상태 변경에 실패했습니다");
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setLoadingItems((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const pendingItems = actionItems.filter((item) => item.status !== "completed");
  const completedItems = actionItems.filter((item) => item.status === "completed");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          액션 아이템
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            액션 아이템이 없습니다
          </p>
        ) : (
          <>
            {pendingItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">진행 중</h4>
                {pendingItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    loading={loadingItems.has(item.id)}
                    onToggle={() => handleToggle(item)}
                  />
                ))}
              </div>
            )}
            {completedItems.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">완료됨</h4>
                {completedItems.map((item) => (
                  <ActionItemRow
                    key={item.id}
                    item={item}
                    loading={loadingItems.has(item.id)}
                    onToggle={() => handleToggle(item)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface ActionItemRowProps {
  item: ActionItem;
  loading: boolean;
  onToggle: () => void;
}

function ActionItemRow({ item, loading, onToggle }: ActionItemRowProps) {
  const isCompleted = item.status === "completed";
  
  return (
    <div
      className={"flex items-start gap-3 p-3 rounded-lg border " + (isCompleted ? "bg-muted/50 opacity-60" : "bg-card")}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={onToggle}
        disabled={loading}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p className={"text-sm " + (isCompleted ? "line-through" : "")}>
          {item.task}
        </p>
        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <User className="h-3 w-3" />
            {item.assignee_name}
          </span>
          {item.deadline && (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(item.deadline).toLocaleDateString("ko-KR")}
            </span>
          )}
          <Badge 
            variant="secondary" 
            className={"text-white " + priorityColors[item.priority]}
          >
            {priorityLabels[item.priority]}
          </Badge>
        </div>
      </div>
    </div>
  );
}
