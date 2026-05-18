import { NextRequest, NextResponse } from 'next/server';
import { fetchNaverPlaceDetail } from '@/lib/naver-place-detail';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title')?.trim() || '';
  const address = req.nextUrl.searchParams.get('address')?.trim() || '';
  const placeLink = req.nextUrl.searchParams.get('placeLink')?.trim() || req.nextUrl.searchParams.get('link')?.trim() || '';

  const result = await fetchNaverPlaceDetail({ title, address, link: placeLink });
  return NextResponse.json(result);
}
