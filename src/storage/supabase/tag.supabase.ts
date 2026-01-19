import type { SupabaseClient } from "@supabase/supabase-js";
import type { TagRepository } from "@/repositories/tag.repository";
import type { Tag, CreateTagInput, UpdateTagInput } from "@/repositories/types";
import { tagSchema } from "@/repositories/types";

export class SupabaseTagRepository implements TagRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreateTagInput): Promise<Tag> {
    const { data: tag, error } = await this.supabase
      .from("tags")
      .insert(data)
      .select()
      .single();

    if (error) throw new Error(`Failed to create tag: ${error.message}`);
    return tagSchema.parse(tag);
  }

  async getById(id: string): Promise<Tag | null> {
    const { data: tag, error } = await this.supabase
      .from("tags")
      .select()
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get tag: ${error.message}`);
    }
    return tagSchema.parse(tag);
  }

  async getByName(name: string): Promise<Tag | null> {
    const { data: tag, error } = await this.supabase
      .from("tags")
      .select()
      .eq("name", name)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw new Error(`Failed to get tag by name: ${error.message}`);
    }
    return tagSchema.parse(tag);
  }

  async list(): Promise<Tag[]> {
    const { data: tags, error } = await this.supabase
      .from("tags")
      .select()
      .order("name");

    if (error) throw new Error(`Failed to list tags: ${error.message}`);
    return tags.map((t) => tagSchema.parse(t));
  }

  async update(id: string, data: UpdateTagInput): Promise<Tag> {
    const { data: tag, error } = await this.supabase
      .from("tags")
      .update(data)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update tag: ${error.message}`);
    return tagSchema.parse(tag);
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("tags").delete().eq("id", id);

    if (error) throw new Error(`Failed to delete tag: ${error.message}`);
  }

  async findOrCreateByNames(names: string[]): Promise<Tag[]> {
    const tags: Tag[] = [];

    for (const name of names) {
      let tag = await this.getByName(name);
      if (!tag) {
        tag = await this.create({ name });
      }
      tags.push(tag);
    }

    return tags;
  }
}
