import { NextRequest, NextResponse } from 'next/server';
import { searchNaverLocal } from '@/lib/naver-place';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')?.trim() || '';
  if (!query) return NextResponse.json({ message: 'query is required' }, { status: 400 });

  try {
    const items = await searchNaverLocal(query);
    if (items.length === 0) return NextResponse.json({ message: '검색 결과가 없습니다.' }, { status: 404 });
    return NextResponse.json({ item: items[0] });
  } catch (error) {
    const message = error instanceof Error ? error.message : '업체 정보를 불러오지 못했습니다.';
    const status = message.includes('NAVER_CLIENT_ID') ? 500 : 502;
    return NextResponse.json({ message }, { status });
  }
}
