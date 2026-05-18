function isPlaceLink(url: string) {
  return url.includes('place.naver.com') || url.includes('map.naver.com');
}

function stripHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\u003C/g, '<')
    .replace(/\u003E/g, '>')
    .replace(/\s+\n/g, '\n')
    .replace(/\n\s+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function normalizeNewlines(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

function collectJsonStrings(html: string) {
  const out: string[] = [];
  const patterns = [
    /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/gi,
    /window\.__APOLLO_STATE__\s*=\s*({[\s\S]*?});/gi,
    /<script[^>]*type="application\/json"[^>]*>([\s\S]*?)<\/script>/gi
  ];
  for (const p of patterns) {
    let m: RegExpExecArray | null;
    while ((m = p.exec(html))) out.push(m[1]);
  }
  return out;
}

function deepFindText(node: unknown, keys: string[], bucket: string[]) {
  if (!node) return;
  if (typeof node === 'object') {
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      const key = k.toLowerCase();
      if (keys.some((kk) => key.includes(kk)) && typeof v === 'string' && v.trim()) {
        bucket.push(v.trim());
      }
      deepFindText(v, keys, bucket);
    }
  }
}

function extractIntroFromHtml(html: string) {
  const wanted = ['introduction', 'businessdescription', 'descriptiontext', 'description', 'intro', 'microreview', 'guide'];
  const candidates: string[] = [];

  for (const raw of collectJsonStrings(html)) {
    try {
      const parsed = JSON.parse(raw);
      deepFindText(parsed, wanted, candidates);
    } catch {
      // ignore json parse failure
    }
  }

  const infoSectionPatterns = [
    /정보[\s\S]{0,120}소개[\s\S]{0,1000}/gi,
    /소개[\s\S]{0,1200}/gi
  ];
  for (const p of infoSectionPatterns) {
    const m = html.match(p);
    if (m?.[0]) candidates.push(m[0]);
  }

  const cleaned = candidates
    .map((v) => normalizeNewlines(stripHtml(v)))
    .filter((v) => v && v.length >= 8)
    .sort((a, b) => b.length - a.length);

  return cleaned[0] || '';
}

function toMobileLink(link: string) {
  if (!link) return '';
  const id = link.match(/\/place\/(\d+)/)?.[1] || link.match(/[?&]id=(\d+)/)?.[1];
  if (id) return `https://m.place.naver.com/place/${id}`;
  return link;
}

export async function fetchNaverPlaceDetail(params: { title: string; address: string; link: string }) {
  const candidateLink = toMobileLink((params.link || '').trim());
  if (!candidateLink || !isPlaceLink(candidateLink)) {
    return { placeLink: '', intro: '플레이스 소개 정보 없음' };
  }

  try {
    const res = await fetch(candidateLink, { cache: 'no-store' });
    if (!res.ok) return { placeLink: candidateLink, intro: '플레이스 소개 정보 없음' };
    const html = await res.text();
    const intro = extractIntroFromHtml(html);
    return { placeLink: candidateLink, intro: intro || '플레이스 소개 정보 없음' };
  } catch {
    return { placeLink: candidateLink, intro: '플레이스 소개 정보 없음' };
  }
}

export function resolveSafePlaceLink(foundPlaceLink: string, cleanTitle: string) {
  const trimmed = (foundPlaceLink || '').trim();
  if (trimmed && isPlaceLink(trimmed)) return trimmed;
  if (cleanTitle.trim()) return `https://map.naver.com/p/search/${encodeURIComponent(cleanTitle.trim())}`;
  return '플레이스 링크 확인 필요';
}
