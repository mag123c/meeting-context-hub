import { Navbar } from "@/components/layout";
import { SlackIntegration, NotionIntegration } from "@/components/features/settings";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <h1 className="text-2xl font-bold mb-6">연동 설정</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <SlackIntegration />
          <NotionIntegration />
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h2 className="text-lg font-semibold mb-2">환경변수 설정 방법</h2>
          <p className="text-sm text-muted-foreground mb-4">
            외부 서비스 연동을 위해 다음 환경변수를 설정하세요.
          </p>
          <div className="space-y-2 font-mono text-sm">
            <div className="p-2 bg-background rounded border">
              <code>SLACK_BOT_TOKEN</code> - Slack Bot OAuth Token
            </div>
            <div className="p-2 bg-background rounded border">
              <code>NOTION_API_KEY</code> - Notion Integration Token
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
