import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

function buildPrompt(input: {
  keyword: string;
  photoCount: number;
  guideline: string;
  mapLink: string;
  hashtags: string;
  tone: string;
}) {
  return `다음 정보를 기반으로 네이버 블로그 원고를 작성해줘.

[입력 정보]
- 키워드: ${input.keyword}
- 사진 장수: ${input.photoCount}
- 가이드라인: ${input.guideline}
- 링크(지도첨부): ${input.mapLink}
- 해시태그: ${input.hashtags}
- 말투(컨셉): ${input.tone}

[필수 규칙]
해당 키워드로 2500자 이상, 가이드 내용을 참고해서 네이버 블로그 상위노출용 후기성 원고를 작성해줘.
키워드 반복수는 본문 안에 6회 이상 자연스럽게 포함해줘.
실제 이용자가 쓴 것처럼 자연스럽고 신뢰감 있게 작성해줘.
문단은 모바일에서 읽기 좋게 적당히 나눠줘.
사진 장수에 맞춰 본문 중간중간에 이미지 순번을 1번부터 순서대로 자연스럽게 삽입해줘.
이미지 부제목은 붙이지 말고 원고 안에 순번만 표시해줘.
제목과 본문 내용의 연관성을 맞춰줘.
가이드라인에 없는 내용은 임의로 과하게 덧붙이지 말아줘.
말투(컨셉)를 반영해서 작성해줘.

[출력 형식]
제목 :
본문 :
링크(지도첨부) :
해시태그 :`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getOpenAIClient();
    const prompt = buildPrompt(body);

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      messages: [
        { role: 'system', content: '너는 네이버 블로그 콘텐츠 전문 에디터다.' },
        { role: 'user', content: prompt }
      ]
    });

    const text = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({ result: text });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'AI 원고 생성 실패' },
      { status: 500 }
    );
  }
}
