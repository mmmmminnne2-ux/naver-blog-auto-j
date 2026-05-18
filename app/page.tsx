'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { formatPostContent } from '@/lib/format-post';
import { createPost, fetchPosts } from '@/lib/post-service';
import { publishToNaver } from '@/lib/naver-publisher';
import type { DraftContent, FormatOptions, PublishStatus, SavedPost } from '@/types/post';

const initialDraft: DraftContent = { title: '', body: '', mapLink: '', hashtags: '' };
const initialFormatOptions: FormatOptions = { enableSubtitles: true, enableBold: true, enableHighlight: true, enableKeywordColor: true };

function parseGenerated(raw: string): DraftContent {
  const title = raw.match(/제목\s*:\s*([\s\S]*?)\n본문\s*:/)?.[1]?.trim() ?? '';
  const body = raw.match(/본문\s*:\s*([\s\S]*?)\n링크\(지도첨부\)\s*:/)?.[1]?.trim() ?? '';
  const mapLink = raw.match(/링크\(지도첨부\)\s*:\s*([\s\S]*?)\n해시태그\s*:/)?.[1]?.trim() ?? '';
  const hashtags = raw.match(/해시태그\s*:\s*([\s\S]*)$/)?.[1]?.trim() ?? '';
  return { title, body, mapLink, hashtags };
}

export default function HomePage() {
  const [keyword, setKeyword] = useState('');
  const [photoCount, setPhotoCount] = useState(1);
  const [guideline, setGuideline] = useState('');
  const [mapLinkInput, setMapLinkInput] = useState('');
  const [hashtagsInput, setHashtagsInput] = useState('');
  const [tone, setTone] = useState('친근하고 신뢰감 있는 후기 톤');
  const [photos, setPhotos] = useState<File[]>([]);
  const [draft, setDraft] = useState<DraftContent>(initialDraft);
  const [formattedBody, setFormattedBody] = useState('');
  const [formatOptions, setFormatOptions] = useState<FormatOptions>(initialFormatOptions);
  const [savedPosts, setSavedPosts] = useState<SavedPost[]>([]);
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [publishStatus, setPublishStatus] = useState<PublishStatus>('idle');

  useEffect(() => { void loadPosts(); }, []);
  useEffect(() => setFormattedBody(formatPostContent(draft.body, formatOptions)), [draft.body, formatOptions]);

  const mismatch = useMemo(() => photos.length !== photoCount, [photos.length, photoCount]);

  async function loadPosts() { try { setSavedPosts(await fetchPosts()); } catch (e) { setStatus(e instanceof Error ? e.message : '저장 목록 조회 실패'); } }

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setIsGenerating(true);
    setStatus('AI 원고 생성 중...');
    try {
      const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keyword, photoCount, guideline, mapLink: mapLinkInput, hashtags: hashtagsInput, tone }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? 'AI 원고 생성 실패');
      setDraft(parseGenerated(data.result));
      setStatus('AI 원고 생성 완료 + 자동 서식 적용');
    } catch (e) { setStatus(e instanceof Error ? e.message : 'AI 원고 생성 실패'); } finally { setIsGenerating(false); }
  }

  async function handleSave() {
    try {
      await createPost({ keyword, photoCount, guideline, mapLink: draft.mapLink || mapLinkInput, hashtags: draft.hashtags || hashtagsInput, tone, title: draft.title, body: draft.body, rawContent: draft.body, formattedContent: formattedBody, photoUrls: photos.map((f) => f.name) });
      setStatus('원고 저장 완료');
      await loadPosts();
    } catch (e) { setStatus(e instanceof Error ? e.message : '원고 저장 실패'); }
  }

  async function handlePublish() {
    setPublishStatus('publishing');
    const result = await publishToNaver({ keyword, photoCount, guideline, mapLink: draft.mapLink || mapLinkInput, hashtags: draft.hashtags || hashtagsInput, tone, title: draft.title, body: formattedBody, photoUrls: photos.map((f) => f.name) });
    setPublishStatus(result.ok ? 'success' : 'failed');
    setStatus(result.message);
  }

  async function handleCopyAll() {
    const text = `제목 : ${draft.title}\n\n본문 :\n${draft.body}\n\n링크(지도첨부) : ${draft.mapLink}\n\n해시태그 : ${draft.hashtags}`;
    await navigator.clipboard.writeText(text);
    setStatus('복사 완료');
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-4 p-4 md:p-8">
      <h1 className="rounded-2xl bg-white p-5 text-xl font-semibold shadow-sm">네이버 블로그 자동발행 관리자</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleGenerate} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <input className="w-full rounded-lg border p-3" placeholder="1. 키워드" value={keyword} onChange={(e)=>setKeyword(e.target.value)} required />
          <input className="w-full rounded-lg border p-3" type="number" min={1} value={photoCount} onChange={(e)=>setPhotoCount(Number(e.target.value))} required />
          <textarea className="min-h-28 w-full rounded-lg border p-3" placeholder="3. 가이드라인" value={guideline} onChange={(e)=>setGuideline(e.target.value)} required />
          <input className="w-full rounded-lg border p-3" placeholder="4. 링크(지도첨부)" value={mapLinkInput} onChange={(e)=>setMapLinkInput(e.target.value)} />
          <input className="w-full rounded-lg border p-3" placeholder="5. 해시태그" value={hashtagsInput} onChange={(e)=>setHashtagsInput(e.target.value)} />
          <input multiple accept="image/*" type="file" className="w-full rounded-lg border p-3" onChange={(e)=>setPhotos(Array.from(e.target.files ?? []))} />
          <input className="w-full rounded-lg border p-3" placeholder="7. 말투(컨셉)" value={tone} onChange={(e)=>setTone(e.target.value)} />
          {mismatch && <p className="text-sm text-amber-600">사진 장수 입력값({photoCount})과 실제 업로드({photos.length})가 다릅니다.</p>}
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <label><input type="checkbox" checked={formatOptions.enableSubtitles} onChange={(e)=>setFormatOptions((p)=>({...p, enableSubtitles: e.target.checked}))} /> 소제목 자동 생성</label>
            <label><input type="checkbox" checked={formatOptions.enableBold} onChange={(e)=>setFormatOptions((p)=>({...p, enableBold: e.target.checked}))} /> 핵심 문장 굵게 표시</label>
            <label><input type="checkbox" checked={formatOptions.enableHighlight} onChange={(e)=>setFormatOptions((p)=>({...p, enableHighlight: e.target.checked}))} /> 형광펜 강조 적용</label>
            <label><input type="checkbox" checked={formatOptions.enableKeywordColor} onChange={(e)=>setFormatOptions((p)=>({...p, enableKeywordColor: e.target.checked}))} /> 컬러 키워드 강조 적용</label>
          </div>
          <div className="grid grid-cols-2 gap-2"><button className="rounded-lg bg-blue-600 p-3 text-white" disabled={isGenerating}>{isGenerating ? '생성 중...' : 'AI 원고 생성'}</button><button type="button" onClick={handleSave} className="rounded-lg bg-slate-900 p-3 text-white">저장</button></div>
        </form>

        <section className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <input className="w-full rounded-lg border p-3" value={draft.title} onChange={(e)=>setDraft((p)=>({...p, title: e.target.value}))} placeholder="제목 :" />
          <textarea className="min-h-40 w-full rounded-lg border p-3" value={draft.body} onChange={(e)=>setDraft((p)=>({...p, body: e.target.value}))} placeholder="원본 텍스트 편집" />
          <div className="rounded-xl border p-4"><style jsx>{`mark{background:#fff3a3;padding:0 2px}.keyword-highlight{color:#2563eb;font-weight:600}h2{font-weight:700;margin:16px 0 8px}p{margin:0 0 10px;line-height:1.7}`}</style><div dangerouslySetInnerHTML={{ __html: formattedBody }} /></div>
          <div className="grid grid-cols-2 gap-2"><button type="button" onClick={handleCopyAll} className="rounded-lg bg-slate-200 p-3">복사하기</button><button type="button" onClick={handlePublish} className="rounded-lg bg-emerald-600 p-3 text-white">네이버 자동발행</button></div>
          {publishStatus === 'publishing' && <p className="text-sm text-slate-500">자동발행 진행 중...</p>}
          {status && <p className="text-sm text-slate-600">{status}</p>}
        </section>
      </div>

      <section className="rounded-2xl bg-white p-4 shadow-sm"><h2 className="mb-3 font-semibold">저장된 원고 리스트</h2><div className="grid gap-3 md:grid-cols-2">{savedPosts.map((post) => <article key={post.id} className="rounded-xl border p-3"><p className="font-medium">{post.title}</p><p className="text-sm text-slate-500">키워드: {post.keyword}</p></article>)}{savedPosts.length===0 && <p className="text-sm text-slate-500">저장된 원고가 없습니다.</p>}</div></section>
    </main>
  );
}
