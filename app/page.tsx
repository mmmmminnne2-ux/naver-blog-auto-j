'use client';

import { FormEvent, useMemo, useState } from 'react';
import { formatPostContent } from '@/lib/format-post';
import type { PlaceProfile } from '@/types/post';

type PostType = 'place' | 'store' | 'general';

const emptyProfile: PlaceProfile = { businessName: '', contact: '', address: '', placeLink: '', intro: '', category: '' };

export default function HomePage() {
  const [postType, setPostType] = useState<PostType>('place');
  const [profile, setProfile] = useState<PlaceProfile>(emptyProfile);
  const [keyword, setKeyword] = useState('');
  const [guideline, setGuideline] = useState('');
  const [extraGuide, setExtraGuide] = useState('');
  const [tone, setTone] = useState('20대 여성 발랄한 후기 말투');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [referenceExtracted, setReferenceExtracted] = useState<Record<string, unknown> | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);
  const [toast, setToast] = useState('');

  const photoCount = photos.length;
  const formatted = useMemo(() => formatPostContent(body, { enableSubtitles: true, enableBold: true, enableHighlight: true, enableKeywordColor: true }), [body]);



  function resetPlaceFields() {
    setProfile((prev) => ({ ...prev, contact: '', address: '', placeLink: '', intro: '', category: '' }));
    setKeyword('');
    setGuideline('');
    setExtraGuide('');
    setReferenceUrl('');
    setLink('');
    setHashtags('');
  }

  async function handleAutoFill() {
    const query = profile.businessName.trim();
    if (!query) return setToast('업체명을 입력해 주세요.');

    resetPlaceFields();
    setProfile((prev) => ({ ...prev, businessName: query }));
    setAutoFilling(true);

    try {
      const res = await fetch(`/api/naver-place?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || '업체 정보를 불러오지 못했습니다.');

      const item = data.item;
      const cleanTitle = item.title || query;
      const telephone = item.telephone || '연락처 정보 없음';
      const address = item.roadAddress || item.address || '';
      const linkValue = item.link || '';
      const categoryText = item.category || '';

      console.log('NAVER PLACE RESULT', {
        title: cleanTitle,
        telephone,
        address: item.address || '',
        roadAddress: item.roadAddress || '',
        link: linkValue,
        category: categoryText
      });

      setProfile({
        businessName: cleanTitle,
        contact: telephone,
        address,
        placeLink: linkValue,
        intro: '',
        category: categoryText
      });

      setReferenceUrl(linkValue);
      setLink(linkValue);

      setGuideline(`업체명: ${cleanTitle}
카테고리: ${categoryText}
주소: ${address}
연락수단: ${telephone}
플레이스 링크: ${linkValue}`);

      // 업체 소개 정보는 현재 네이버 지역 검색 API에서 제공되지 않습니다. 추후 플레이스 상세 파서 연결 필요.

      setToast('업체 정보를 자동 입력했습니다.');
    } catch (e) {
      setToast(e instanceof Error ? e.message : '업체 정보를 불러오지 못했습니다.');
    } finally {
      setAutoFilling(false);
    }
  }

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ postType, businessName: profile.businessName, address: profile.address, contact: profile.contact, intro: profile.intro, category: profile.category, keyword, guideline, extraGuide, tone, referenceUrl, referenceExtracted, photoCount }) });
    const data = await res.json();
    const raw = data.result ?? '';
    setTitle(raw.match(/제목\s*:\s*([\s\S]*?)\n본문\s*:/)?.[1]?.trim() ?? '');
    setBody(raw.match(/본문\s*:\s*([\s\S]*?)\n링크\(지도첨부\)\s*:/)?.[1]?.trim() ?? '');
    setLink(raw.match(/링크\(지도첨부\)\s*:\s*([\s\S]*?)\n해시태그\s*:/)?.[1]?.trim() ?? '');
    setHashtags(raw.match(/해시태그\s*:\s*([\s\S]*)$/)?.[1]?.trim() ?? '');
    setLoading(false);
  }

  return <main className="mx-auto min-h-screen max-w-7xl p-4 md:p-8">
    <div className="mb-4 card p-4 text-center text-lg font-semibold">AD:ME 블로그 자동프로그램 베타</div>
    <div className="grid gap-4 xl:grid-cols-2">
      <form onSubmit={onGenerate} className="card space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2">{(['place','store','general'] as PostType[]).map((t)=><button key={t} type="button" onClick={()=>setPostType(t)} className={`btn ${postType===t?'bg-indigo-500 text-white':'bg-slate-800 text-slate-200'}`}>{t==='place'?'플레이스 배포':t==='store'?'스토어 배포':'일반 배포'}</button>)}</div>
        <div className="flex gap-2"><input className="input" placeholder="업체이름" value={profile.businessName} onChange={(e)=>setProfile((p)=>({...p,businessName:e.target.value}))} /><button type="button" className="btn bg-slate-800" onClick={handleAutoFill}>{autoFilling?'불러오는 중...':'자동 입력'}</button></div>
        <div className="grid gap-2 md:grid-cols-2"><input className="input" placeholder="연락수단" value={profile.contact} onChange={(e)=>setProfile((p)=>({...p,contact:e.target.value}))} /><input className="input" placeholder="위치" value={profile.address} onChange={(e)=>setProfile((p)=>({...p,address:e.target.value}))} /></div>
        <input className="input" placeholder="업체 소개" value={profile.intro} onChange={(e)=>setProfile((p)=>({...p,intro:e.target.value}))} />
        <input className="input" placeholder="키워드" value={keyword} onChange={(e)=>setKeyword(e.target.value)} />
        <textarea className="input min-h-24" placeholder="가이드라인" value={guideline} onChange={(e)=>setGuideline(e.target.value)} />
        <div className="text-xs text-slate-400">카테고리 참고: {profile.category || '-'}</div>
        <input className="input" placeholder={postType==='place'?'링크(지도첨부)':postType==='store'?'링크(스마트스토어)':'링크(외부링크)'} value={referenceUrl} onChange={(e)=>setReferenceUrl(e.target.value)} />
        <button className="btn w-full bg-indigo-500 text-white">{loading?'생성중...':'AI 원고 생성'}</button>
      </form>
      <section className="card space-y-3 p-4">
        <input className="input" placeholder="제목" value={title} onChange={(e)=>setTitle(e.target.value)} />
        <textarea className="input min-h-56" placeholder="본문" value={body} onChange={(e)=>setBody(e.target.value)} />
        <input className="input" placeholder={postType==='place' ? '링크(지도첨부)' : postType==='store' ? '링크(스마트스토어)' : '링크(외부링크)'} value={link} onChange={(e)=>setLink(e.target.value)} />
        <input className="input" placeholder="해시태그" value={hashtags} onChange={(e)=>setHashtags(e.target.value)} />
        <div className="rounded-xl border border-slate-700 bg-white p-4 text-slate-900"><div dangerouslySetInnerHTML={{ __html: formatted }} /></div>
      </section>
    </div>
    {toast && <div className="fixed bottom-5 right-5 rounded-xl bg-slate-800 px-4 py-2 text-sm shadow-lg">{toast}</div>}
  </main>;
}
