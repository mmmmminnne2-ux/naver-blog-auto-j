'use client';

import { FormEvent, useMemo, useState } from 'react';
import { formatPostContent } from '@/lib/format-post';

type PostType = 'place' | 'store' | 'general';

export default function HomePage() {
  const [postType, setPostType] = useState<PostType>('place');
  const [businessName, setBusinessName] = useState('');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [intro, setIntro] = useState('');
  const [category, setCategory] = useState('');
  const [keyword, setKeyword] = useState('');
  const [guideline, setGuideline] = useState('');
  const [extraGuide, setExtraGuide] = useState('');
  const [tone, setTone] = useState('20대 여성 발랄한 후기 말투');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceExtracted, setReferenceExtracted] = useState<Record<string, unknown> | null>(null);
  const [searchList, setSearchList] = useState<Array<Record<string, string>>>([]);
  const [photos, setPhotos] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [naverId, setNaverId] = useState('');
  const [naverPassword, setNaverPassword] = useState('');

  const photoCount = photos.length;
  const formatted = useMemo(() => formatPostContent(body, { enableSubtitles: true, enableBold: true, enableHighlight: true, enableKeywordColor: true }), [body]);

  async function searchPlace(name: string) {
    setBusinessName(name);
    if (name.length < 2) return setSearchList([]);
    const res = await fetch(`/api/place-search?q=${encodeURIComponent(name)}`);
    const data = await res.json();
    setSearchList(data.items ?? []);
  }

  async function scanReference() {
    const res = await fetch('/api/reference-scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: referenceUrl }) });
    const data = await res.json();
    setReferenceExtracted(data.extracted);
    setToast('참고자료 분석 완료');
  }

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postType, businessName, address, contact, intro, category, keyword, guideline, extraGuide, tone, referenceUrl, referenceExtracted, photoCount }) });
    const data = await res.json();
    const raw = data.result ?? '';
    setTitle(raw.match(/제목\s*:\s*([\s\S]*?)\n본문\s*:/)?.[1]?.trim() ?? '');
    setBody(raw.match(/본문\s*:\s*([\s\S]*?)\n링크\(지도첨부\)\s*:/)?.[1]?.trim() ?? '');
    setLink(raw.match(/링크\(지도첨부\)\s*:\s*([\s\S]*?)\n해시태그\s*:/)?.[1]?.trim() ?? '');
    setHashtags(raw.match(/해시태그\s*:\s*([\s\S]*)$/)?.[1]?.trim() ?? '');
    setLoading(false);
    setToast('AI 원고 생성 완료');
  }

  async function onPublish() {
    const res = await fetch('/api/naver-publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ naverId, naverPassword, post: { title, body: formatted, link, hashtags, photoNames: photos.map((p) => p.name) } }) });
    const data = await res.json();
    setToast(data.message || '완료');
  }

  return <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-8">
    <div className="mb-4 card p-4 text-center text-lg font-semibold">AD:ME 블로그 자동프로그램 베타</div>
    <div className="grid gap-4 xl:grid-cols-2">
      <form onSubmit={onGenerate} className="card space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">
          {(['place', 'store', 'general'] as PostType[]).map((t) => <button key={t} type="button" onClick={() => setPostType(t)} className={`btn ${postType===t?'bg-indigo-500 text-white':'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{t==='place'?'플레이스 배포':t==='store'?'스토어 배포':'일반 배포'}</button>)}
        </div>
        <input className="input" placeholder="업체이름" value={businessName} onChange={(e)=>searchPlace(e.target.value)} />
        {searchList.length>0 && <div className="max-h-40 overflow-auto rounded-xl border border-slate-700">{searchList.map((s, i)=><button key={i} type="button" className="block w-full px-3 py-2 text-left hover:bg-slate-800" onClick={()=>{setBusinessName(s.name);setAddress(s.address);setContact(s.phone);setReferenceUrl(s.placeUrl);setIntro(s.intro);setCategory(s.category);setSearchList([]);}}>{s.name}</button>)}</div>}
        <div className="grid gap-2 md:grid-cols-2"><input className="input" placeholder="연락수단" value={contact} onChange={(e)=>setContact(e.target.value)} /><input className="input" placeholder="위치" value={address} onChange={(e)=>setAddress(e.target.value)} /></div>
        <input className="input" placeholder="키워드" value={keyword} onChange={(e)=>setKeyword(e.target.value)} />
        <textarea className="input min-h-24" placeholder="가이드라인" value={guideline} onChange={(e)=>setGuideline(e.target.value)} />
        <textarea className="input min-h-20" placeholder="추가 가이드" value={extraGuide} onChange={(e)=>setExtraGuide(e.target.value)} />
        <input className="input" placeholder="화자/컨셉" value={tone} onChange={(e)=>setTone(e.target.value)} />
        <div className="flex gap-2"><input className="input" placeholder={postType==='place'?'네이버 플레이스 URL':postType==='store'?'스마트스토어 URL':'일반 링크'} value={referenceUrl} onChange={(e)=>setReferenceUrl(e.target.value)} /><button type="button" className="btn bg-slate-800 hover:bg-slate-700" onClick={scanReference}>분석</button></div>
        <label className="flex min-h-28 cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-600 bg-slate-950/60 text-sm" onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();setPhotos(Array.from(e.dataTransfer.files).filter(f=>f.type.startsWith('image/')));}}>드래그&드롭 또는 클릭 업로드
          <input type="file" multiple accept="image/*" className="hidden" onChange={(e)=>setPhotos(Array.from(e.target.files||[]))} />
        </label>
        <div className="grid grid-cols-5 gap-2">{photos.map((p, i)=><div key={i} className="rounded-lg bg-slate-800 p-1 text-[10px]">{i+1}번 {p.name}</div>)}</div>
        <button className="btn w-full bg-indigo-500 text-white hover:bg-indigo-400">{loading ? '생성중...' : 'AI 원고 생성'}</button>
      </form>

      <section className="card space-y-3 p-4">
        <input className="input" placeholder="제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <textarea className="input min-h-56" placeholder="본문" value={body} onChange={(e)=>setBody(e.target.value)} />
        <input className="input" placeholder="링크(지도첨부)" value={link} onChange={(e)=>setLink(e.target.value)} />
        <input className="input" placeholder="해시태그" value={hashtags} onChange={(e)=>setHashtags(e.target.value)} />
        <div className="rounded-xl border border-slate-700 bg-white p-4 text-slate-900"><div dangerouslySetInnerHTML={{ __html: formatted }} /></div>
      </section>
    </div>

    <section className="card mt-4 space-y-3 p-4">
      <h3 className="font-semibold">네이버 자동발행 계정 설정</h3>
      <div className="grid gap-2 md:grid-cols-2"><input className="input" placeholder="네이버 아이디" value={naverId} onChange={(e)=>setNaverId(e.target.value)} /><input className="input" type="password" placeholder="네이버 비밀번호" value={naverPassword} onChange={(e)=>setNaverPassword(e.target.value)} /></div>
      <button type="button" onClick={onPublish} className="btn w-full bg-emerald-500 text-white hover:bg-emerald-400">네이버 자동발행</button>
    </section>

    {toast && <div className="fixed bottom-5 right-5 rounded-xl bg-slate-800 px-4 py-2 text-sm shadow-lg">{toast}</div>}
  </main>;
}
