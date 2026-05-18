import { NextRequest, NextResponse } from 'next/server';
import { publishToNaver } from '@/lib/naver-publisher';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { naverId, naverPassword, post } = body;
  const result = await publishToNaver({ ...post, naverId, naverPassword });
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
