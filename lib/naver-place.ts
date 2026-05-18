export interface NaverPlaceResult {
  title: string;
  telephone: string;
  address: string;
  roadAddress: string;
  link: string;
  category: string;
  description: string;
}

function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, '').trim();
}

function toMobilePlaceUrl(rawLink: string) {
  if (!rawLink) return '';
  const placeIdMatch = rawLink.match(/\/place\/(\d+)/) ?? rawLink.match(/[?&]id=(\d+)/);
  if (placeIdMatch?.[1]) {
    return `https://m.place.naver.com/place/${placeIdMatch[1]}`;
  }
  return rawLink;
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

  if (!response.ok) {
    throw new Error('업체 정보를 불러오지 못했습니다.');
  }

  const data = await response.json();
  const items = (data.items ?? []) as NaverPlaceResult[];

  return items.map((item) => {
    const cleanTitle = stripHtml(item.title || '');
    const category = stripHtml(item.category || '');
    return {
      title: cleanTitle,
      telephone: item.telephone?.trim() || '연락처 정보 없음',
      address: (item.roadAddress || item.address || '').trim(),
      link: toMobilePlaceUrl(item.link || ''),
      category,
      description: `${cleanTitle}은(는) ${category || '지역 기반 서비스'} 중심의 업체로 보이며, 방문 전 운영 정보와 주요 특징을 확인해보는 것이 좋습니다.`
    };
  });
}
