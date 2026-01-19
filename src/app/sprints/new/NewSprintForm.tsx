"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Project } from "@/repositories/types/project.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface NewSprintFormProps {
  projects: Project[];
}

export function NewSprintForm({ projects }: NewSprintFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      project_id: formData.get("project_id") as string,
      name: formData.get("name") as string,
      goal: (formData.get("goal") as string) || null,
      start_date: formData.get("start_date") as string,
      end_date: formData.get("end_date") as string,
    };

    try {
      const res = await fetch("/api/sprint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "스프린트 생성에 실패했습니다");
      }

      const sprint = await res.json();
      toast.success("스프린트가 생성되었습니다");
      router.push(`/sprints/${sprint.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // Default dates: today and 2 weeks later
  const today = new Date().toISOString().split("T")[0];
  const twoWeeksLater = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>스프린트 정보</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project_id">프로젝트 *</Label>
            <Select name="project_id" required>
              <SelectTrigger>
                <SelectValue placeholder="프로젝트 선택" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">스프린트 이름 *</Label>
            <Input
              id="name"
              name="name"
              placeholder="예: Sprint 1 - MVP 개발"
              required
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">스프린트 목표</Label>
            <Textarea
              id="goal"
              name="goal"
              placeholder="이번 스프린트에서 달성하고자 하는 목표"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">시작일 *</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={today}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">종료일 *</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                defaultValue={twoWeeksLater}
                required
              />
            </div>
          </div>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              생성
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
