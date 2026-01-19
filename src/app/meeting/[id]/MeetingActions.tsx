"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MeetingWithTags } from "@/repositories/types/meeting.types";
import { Tag } from "@/repositories/types/tag.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TagSelector } from "@/components/features/tag";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface MeetingActionsProps {
  meeting: MeetingWithTags;
}

export function MeetingActions({ meeting }: MeetingActionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const [title, setTitle] = useState(meeting.title);
  const [rawContent, setRawContent] = useState(meeting.raw_content);
  const [selectedTags, setSelectedTags] = useState<Tag[]>(meeting.tags);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/meeting/" + meeting.id, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("삭제에 실패했습니다");
      }

      toast.success("회의록이 삭제되었습니다");
      router.push("/");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
      setIsDeleting(false);
    }
  };

  const handleEdit = async () => {
    if (!title.trim()) {
      toast.error("제목을 입력해주세요");
      return;
    }

    setIsEditing(true);
    try {
      const res = await fetch("/api/meeting/" + meeting.id, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          raw_content: rawContent,
          tag_ids: selectedTags.map((t) => t.id),
        }),
      });

      if (!res.ok) {
        throw new Error("수정에 실패했습니다");
      }

      toast.success("회의록이 수정되었습니다");
      setEditDialogOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "오류가 발생했습니다");
    } finally {
      setIsEditing(false);
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    setEditDialogOpen(open);
    if (open) {
      // Reset form state when opening
      setTitle(meeting.title);
      setRawContent(meeting.raw_content);
      setSelectedTags(meeting.tags);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4 mr-2" />
            수정
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>회의록 수정</DialogTitle>
            <DialogDescription>
              회의록 제목, 내용, 태그를 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="회의록 제목"
              />
            </div>
            <div className="space-y-2">
              <Label>태그</Label>
              <TagSelector
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                disabled={isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">내용</Label>
              <Textarea
                id="content"
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                placeholder="회의 내용"
                rows={15}
                className="font-mono text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isEditing}
            >
              취소
            </Button>
            <Button onClick={handleEdit} disabled={isEditing}>
              {isEditing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete AlertDialog */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            삭제
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>회의록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 회의록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
