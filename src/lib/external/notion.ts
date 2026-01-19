interface NotionBlock {
  id: string;
  type: string;
  [key: string]: unknown;
}

interface NotionPage {
  id: string;
  properties: Record<string, unknown>;
}

export class NotionClient {
  private token: string;
  private baseUrl = "https://api.notion.com/v1";
  private version = "2022-06-28";

  constructor(token?: string) {
    this.token = token || process.env.NOTION_API_KEY || "";
  }

  private async request<T>(
    endpoint: string,
    method: "GET" | "POST" = "GET",
    body?: unknown
  ): Promise<T> {
    if (!this.token) {
      throw new Error("NOTION_API_KEY is not configured");
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
        "Notion-Version": this.version,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Notion API error: ${error.message || response.statusText}`);
    }

    return response.json();
  }

  async getPage(pageId: string): Promise<NotionPage> {
    return this.request<NotionPage>(`/pages/${pageId}`);
  }

  async getBlocks(blockId: string): Promise<NotionBlock[]> {
    const data = await this.request<{ results: NotionBlock[] }>(
      `/blocks/${blockId}/children`
    );
    return data.results;
  }

  async search(query: string, filter?: { property: string; value: string }): Promise<NotionPage[]> {
    const body: Record<string, unknown> = { query };
    if (filter) {
      body.filter = {
        property: filter.property,
        value: filter.value,
      };
    }

    const data = await this.request<{ results: NotionPage[] }>("/search", "POST", body);
    return data.results;
  }

  private extractTextFromBlock(block: NotionBlock): string {
    const type = block.type;
    const content = block[type] as { rich_text?: Array<{ plain_text: string }> } | undefined;

    if (content?.rich_text) {
      return content.rich_text.map((t) => t.plain_text).join("");
    }

    return "";
  }

  async getPageContent(pageId: string): Promise<string> {
    const blocks = await this.getBlocks(pageId);
    const texts: string[] = [];

    for (const block of blocks) {
      const text = this.extractTextFromBlock(block);
      if (text) {
        texts.push(text);
      }

      // 중첩된 블록 처리
      if (block.has_children) {
        const childBlocks = await this.getBlocks(block.id);
        for (const childBlock of childBlocks) {
          const childText = this.extractTextFromBlock(childBlock);
          if (childText) {
            texts.push(`  ${childText}`);
          }
        }
      }
    }

    return texts.join("\n");
  }
}

export const notionClient = new NotionClient();
