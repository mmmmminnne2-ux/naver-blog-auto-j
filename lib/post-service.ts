import { getSupabaseClient } from '@/lib/supabase';
import type { BlogPost } from '@/types/post';

const TABLE = 'blog_posts';
const BUCKET = 'blog-images';

export async function fetchPosts() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BlogPost[]) ?? [];
}

export async function createPost(input: { title: string; body: string; tags: string[]; image_url: string | null }) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(TABLE).insert({ ...input, status: 'draft' }).select('*').single();
  if (error) throw error;
  return data as BlogPost;
}

export async function publishPost(id: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from(TABLE)
    .update({ status: 'published', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data as BlogPost;
}

export async function uploadImage(file: File) {
  const supabase = getSupabaseClient();
  const ext = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${ext}`;
  const filePath = `posts/${fileName}`;
  const { error } = await supabase.storage.from(BUCKET).upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
  return data.publicUrl;
}
