import { NextRequest, NextResponse } from 'next/server';

const MOCK = [
  { name: '샘플카페 홍대점', address: '서울 마포구 홍익로 10', phone: '02-111-2222', placeUrl: 'https://map.naver.com/p/entry/place/1', intro: '디저트가 유명한 감성 카페', category: '카페' },
  { name: '샘플스테이 강릉', address: '강원 강릉시 해변로 99', phone: '033-123-4567', placeUrl: 'https://map.naver.com/p/entry/place/2', intro: '오션뷰 숙소', category: '숙박' }
];

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() || '';
  const items = MOCK.filter((m) => m.name.includes(q)).slice(0, 6);
  return NextResponse.json({ items });
}
