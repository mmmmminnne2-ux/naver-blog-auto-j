function isPlaceLink(url: string) {
  return url.includes('place.naver.com') || url.includes('map.naver.com');
}

function stripHtml(html: string) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractIntroFromHtml(html: string) {
  const candidates = [
    /<meta property="og:description" content="([^"]+)"/i,
    /<meta name="description" content="([^"]+)"/i,
    /"description"\s*:\s*"([^"]+)"/i,
    /"intro"\s*:\s*"([^"]+)"/i
  ];

  for (const pattern of candidates) {
    const m = html.match(pattern);
    if (m?.[1]) return stripHtml(m[1]);
  }
  return '';
}

export async function fetchNaverPlaceDetail(params: { title: string; address: string; link: string }) {
  const link = params.link?.trim() || '';
  if (!link || !isPlaceLink(link)) {
    return { placeLink: '', intro: '플레이스 소개 정보 없음' };
  }

  try {
    const res = await fetch(link, { cache: 'no-store' });
    if (!res.ok) return { placeLink: link, intro: '플레이스 소개 정보 없음' };
    const html = await res.text();
    const intro = extractIntroFromHtml(html);
    return { placeLink: link, intro: intro || '플레이스 소개 정보 없음' };
  } catch {
    return { placeLink: link, intro: '플레이스 소개 정보 없음' };
  }
}

export { isPlaceLink };


function buildNaverMapSearchUrl(title: string) {
  return `https://map.naver.com/p/search/${encodeURIComponent(title)}`;
}

function isBlockedExternalLink(url: string) {
  return ['instagram.com', 'blog.naver.com', 'smartstore.naver.com'].some((d) => url.includes(d));
}

export function resolveSafePlaceLink(foundPlaceLink: string, cleanTitle: string) {
  const trimmed = (foundPlaceLink || '').trim();
  if (trimmed && isPlaceLink(trimmed) && !isBlockedExternalLink(trimmed)) {
    return trimmed;
  }
  if (cleanTitle.trim()) {
    return buildNaverMapSearchUrl(cleanTitle.trim());
  }
  return '플레이스 링크 확인 필요';
}
