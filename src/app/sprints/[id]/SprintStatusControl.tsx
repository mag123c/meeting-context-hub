"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SprintStatus } from "@/repositories/types/sprint.types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SprintStatusControlProps {
  sprintId: string;
  currentStatus: SprintStatus;
}

const statusOptions: { value: SprintStatus; label: string }[] = [
  { value: "planning", label: "계획 중" },
  { value: "active", label: "진행 중" },
  { value: "completed", label: "완료" },
  { value: "cancelled", label: "취소" },
];

export function SprintStatusControl({ sprintId, currentStatus }: SprintStatusControlProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async (newStatus: SprintStatus) => {
    if (newStatus === currentStatus) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/sprint/${sprintId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("상태 변경에 실패했습니다");
      }

      toast.success("스프린트 상태가 변경되었습니다");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              상태 변경
              <ChevronDown className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {statusOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleStatusChange(option.value)}
            className={currentStatus === option.value ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
