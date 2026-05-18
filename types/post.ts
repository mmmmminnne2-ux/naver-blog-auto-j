export type PostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  body: string;
  tags: string[];
  image_url: string | null;
  status: PostStatus;
  created_at: string;
  updated_at: string;
}
