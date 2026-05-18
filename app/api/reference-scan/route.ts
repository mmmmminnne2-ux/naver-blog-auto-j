import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { url } = await req.json();
  if (!url) return NextResponse.json({ message: 'url required' }, { status: 400 });
  return NextResponse.json({
    extracted: {
      description: '참고 URL에서 추출된 업체 설명(샘플)',
      menu: '대표 메뉴/상품 요약(샘플)',
      features: '특징 및 강점 요약(샘플)',
      reviews: '리뷰 톤 요약(샘플)',
      details: '상세 소개 요약(샘플)',
      keywords: ['가성비', '접근성', '친절']
    }
  });
}
