import { getSupabaseClient } from '@/lib/supabase';
import type { SavedPost } from '@/types/post';

const TABLE = 'blog_posts';

export async function fetchPosts() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return (data as SavedPost[]) ?? [];
}

export async function createPost(post: Omit<SavedPost, 'id' | 'created_at'>) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from(TABLE).insert(post).select('*').single();
  if (error) throw error;
  return data as SavedPost;
}
