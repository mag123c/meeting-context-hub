export interface Tag {
  name: string;
  count: number;
}

export interface TagStats {
  totalTags: number;
  topTags: Tag[];
}
