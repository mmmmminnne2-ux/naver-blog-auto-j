'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createPost, fetchPosts, publishPost, uploadImage } from '@/lib/post-service';
import type { BlogPost } from '@/types/post';

export default function HomePage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    loadPosts();
  }, []);

  const parsedTags = useMemo(
    () => tags.split(',').map((tag) => tag.trim()).filter(Boolean),
    [tags]
  );

  async function loadPosts() {
    try {
      const data = await fetchPosts();
      setPosts(data);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '목록을 불러오지 못했습니다.');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      let imageUrl: string | null = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }

      await createPost({ title, body, tags: parsedTags, image_url: imageUrl });
      setTitle('');
      setBody('');
      setTags('');
      setImage(null);
      setMessage('글이 저장되었습니다.');
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handlePublish(id: string) {
    try {
      await publishPost(id);
      setMessage('발행 상태로 변경되었습니다.');
      await loadPosts();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '발행 실패');
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 p-4 md:p-8">
      <header className="rounded-2xl bg-white p-5 shadow-sm">
        <h1 className="text-xl font-semibold md:text-2xl">네이버 블로그 자동 발행 관리자</h1>
        <p className="mt-1 text-sm text-slate-500">초안 저장부터 발행 상태 관리까지 한 번에 처리합니다.</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">글 작성</h2>
          <input className="w-full rounded-xl border border-slate-200 p-3" placeholder="제목" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <textarea className="min-h-44 w-full rounded-xl border border-slate-200 p-3" placeholder="본문" value={body} onChange={(e) => setBody(e.target.value)} required />
          <input className="w-full rounded-xl border border-slate-200 p-3" placeholder="태그 (쉼표 구분)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <input className="w-full rounded-xl border border-slate-200 p-3 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-brand-600" type="file" accept="image/*" onChange={(e) => setImage(e.target.files?.[0] ?? null)} />
          <button disabled={loading} className="w-full rounded-xl bg-brand-500 px-4 py-3 font-medium text-white hover:bg-brand-600 disabled:opacity-50">{loading ? '저장 중...' : '작성한 글 저장'}</button>
          {message && <p className="text-sm text-slate-600">{message}</p>}
        </form>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">저장된 글 리스트</h2>
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{post.tags.join(', ') || '태그 없음'}</p>
                    <p className="mt-2 text-xs text-slate-400">상태: {post.status === 'published' ? '발행 완료' : '초안'}</p>
                  </div>
                  <button onClick={() => handlePublish(post.id)} disabled={post.status === 'published'} className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white disabled:bg-slate-300">발행</button>
                </div>
              </li>
            ))}
            {posts.length === 0 && <li className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">저장된 글이 없습니다.</li>}
          </ul>
        </div>
      </section>
    </main>
  );
}
