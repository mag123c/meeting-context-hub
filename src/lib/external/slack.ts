interface SlackMessage {
  ts: string;
  channel: string;
  user: string;
  text: string;
}

interface SlackUser {
  id: string;
  name: string;
  real_name: string;
}

interface SlackChannel {
  id: string;
  name: string;
}

export class SlackClient {
  private token: string;
  private baseUrl = "https://slack.com/api";

  constructor(token?: string) {
    this.token = token || process.env.SLACK_BOT_TOKEN || "";
  }

  private async request<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    if (!this.token) {
      throw new Error("SLACK_BOT_TOKEN is not configured");
    }

    const url = new URL(`${this.baseUrl}/${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return data;
  }

  async listChannels(limit = 100): Promise<SlackChannel[]> {
    const data = await this.request<{ channels: SlackChannel[] }>("conversations.list", {
      types: "public_channel,private_channel",
      limit: limit.toString(),
    });
    return data.channels;
  }

  async getMessages(channel: string, limit = 100): Promise<SlackMessage[]> {
    const data = await this.request<{ messages: SlackMessage[] }>("conversations.history", {
      channel,
      limit: limit.toString(),
    });
    return data.messages;
  }

  async getUser(userId: string): Promise<SlackUser> {
    const data = await this.request<{ user: SlackUser }>("users.info", {
      user: userId,
    });
    return data.user;
  }

  async formatMessagesForContext(
    channel: string,
    limit = 50
  ): Promise<string> {
    const messages = await this.getMessages(channel, limit);
    const userCache = new Map<string, SlackUser>();

    const formatted = await Promise.all(
      messages.reverse().map(async (msg) => {
        if (!userCache.has(msg.user)) {
          try {
            userCache.set(msg.user, await this.getUser(msg.user));
          } catch {
            userCache.set(msg.user, { id: msg.user, name: "unknown", real_name: "Unknown" });
          }
        }
        const user = userCache.get(msg.user)!;
        return `[${user.real_name || user.name}] ${msg.text}`;
      })
    );

    return formatted.join("\n");
  }
}

export const slackClient = new SlackClient();
