"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SlackChannel {
  id: string;
  name: string;
}

export function SlackIntegration() {
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    fetchChannels();
  }, []);

  const fetchChannels = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sync/slack");
      if (response.status === 503) {
        setIsConfigured(false);
        return;
      }
      if (!response.ok) throw new Error("Failed to fetch channels");
      const data = await response.json();
      setChannels(data.channels || []);
      setIsConfigured(true);
    } catch (error) {
      console.error("Failed to fetch Slack channels:", error);
      toast.error("Slack 채널 목록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    if (!selectedChannel) {
      toast.error("채널을 선택해주세요");
      return;
    }

    setIsSyncing(true);
    try {
      const response = await fetch("/api/sync/slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channelId: selectedChannel }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Sync failed");
      }

      toast.success("Slack 메시지가 동기화되었습니다");
    } catch (error) {
      console.error("Failed to sync Slack:", error);
      toast.error("동기화에 실패했습니다");
    } finally {
      setIsSyncing(false);
    }
  };

  if (!isConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Slack 연동
            <Badge variant="secondary">미설정</Badge>
          </CardTitle>
          <CardDescription>
            Slack 연동을 위해 환경변수를 설정해주세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <code>SLACK_BOT_TOKEN</code> 환경변수가 필요합니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Slack 연동
          <Badge variant="default">연결됨</Badge>
        </CardTitle>
        <CardDescription>
          Slack 채널의 메시지를 컨텍스트로 동기화합니다
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">채널 선택</label>
          <Select
            value={selectedChannel}
            onValueChange={setSelectedChannel}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="채널을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {channels.map((channel) => (
                <SelectItem key={channel.id} value={channel.id}>
                  #{channel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleSync}
          disabled={!selectedChannel || isSyncing}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              동기화 중...
            </>
          ) : (
            "메시지 동기화"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
