import { Navbar } from "@/components/layout";
import { SlackIntegration, NotionIntegration } from "@/components/features/settings";

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container py-8">
        <header className="mb-8">
          <h1 className="font-serif text-3xl font-semibold tracking-tight">연동 설정</h1>
          <p className="text-muted-foreground mt-1">외부 서비스와 연동하여 데이터를 동기화하세요</p>
        </header>

        <div className="grid gap-6 md:grid-cols-2">
          <SlackIntegration />
          <NotionIntegration />
        </div>

        <section className="mt-8 p-5 bg-muted rounded-md border border-border">
          <h2 className="font-serif text-lg font-medium mb-3">환경변수 설정 방법</h2>
          <p className="text-sm text-muted-foreground mb-4">
            외부 서비스 연동을 위해 다음 환경변수를 설정하세요.
          </p>
          <div className="space-y-2">
            <div className="p-3 bg-background rounded border border-border font-mono text-sm">
              <code className="text-primary">SLACK_BOT_TOKEN</code>
              <span className="text-muted-foreground ml-2">- Slack Bot OAuth Token</span>
            </div>
            <div className="p-3 bg-background rounded border border-border font-mono text-sm">
              <code className="text-primary">NOTION_API_KEY</code>
              <span className="text-muted-foreground ml-2">- Notion Integration Token</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
