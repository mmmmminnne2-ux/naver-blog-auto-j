export interface NaverPlaceResult {
  title: string;
  telephone: string;
  address: string;
  roadAddress: string;
  link: string;
  category: string;
}

export interface NormalizedNaverPlace {
  title: string;
  telephone: string;
  address: string;
  roadAddress: string;
  link: string;
  category: string;
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, '').trim();
}

export async function searchNaverLocal(query: string) {
  const clientId = process.env.NAVER_CLIENT_ID;
  const clientSecret = process.env.NAVER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('NAVER_CLIENT_ID 또는 NAVER_CLIENT_SECRET이 설정되지 않았습니다.');
  }

  const url = `https://openapi.naver.com/v1/search/local.json?query=${encodeURIComponent(query)}&display=5&start=1&sort=random`;
  const response = await fetch(url, {
    headers: {
      'X-Naver-Client-Id': clientId,
      'X-Naver-Client-Secret': clientSecret
    },
    cache: 'no-store'
  });

  if (!response.ok) throw new Error('업체 정보를 불러오지 못했습니다.');

  const data = await response.json();
  const items = (data.items ?? []) as NaverPlaceResult[];

  return items.map<NormalizedNaverPlace>((item) => ({
    title: stripHtml(item.title || ''),
    telephone: item.telephone?.trim() || '연락처 정보 없음',
    address: (item.roadAddress || item.address || '').trim(),
    roadAddress: (item.roadAddress || '').trim(),
    link: (item.link || '').trim(),
    category: stripHtml(item.category || '')
  }));
}
