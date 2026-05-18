import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const client = getOpenAIClient();
    const prompt = `너는 네이버 블로그 상위노출형 후기 에디터다.

[입력]
글 종류:${body.postType}
업체명:${body.businessName}
주소:${body.address}
연락처:${body.contact}
카테고리:${body.category}
업체 소개:${body.intro}
키워드:${body.keyword}
가이드라인:${body.guideline}
추가 가이드:${body.extraGuide}
화자/컨셉:${body.tone}
참고 URL:${body.referenceUrl}
참고 URL 추출:${JSON.stringify(body.referenceExtracted || {})}
사진 수:${body.photoCount}

[규칙]
- 해당 키워드 기준 네이버 블로그 상위노출용 후기성 원고
- 최소 2500자 이상
- 키워드 반복 6회 이상
- 실제 이용자 후기처럼 자연스럽게
- 모바일 가독성 좋게 줄바꿈
- 이미지 순번 1번~${body.photoCount}번 자동 삽입
- 말투/컨셉 반영
- 참고 URL 및 업체 정보 적극 활용
- 과한 광고 느낌 지양

[출력 형식]
제목 :
본문 :
링크(지도첨부) :
해시태그 :`;

    const completion = await client.chat.completions.create({
      model: 'gpt-4.1-mini',
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }]
    });

    return NextResponse.json({ result: completion.choices[0]?.message?.content ?? '' });
  } catch (error) {
    return NextResponse.json({ message: error instanceof Error ? error.message : 'AI 원고 생성 실패' }, { status: 500 });
  }
}
