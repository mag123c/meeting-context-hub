import type { CreateContextInput } from "../types/context.types.js";

export class TextHandler {
  handle(text: string): CreateContextInput {
    return {
      type: "text",
      content: text.trim(),
    };
  }
}
