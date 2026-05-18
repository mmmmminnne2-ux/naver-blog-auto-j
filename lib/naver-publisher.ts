import type { DraftContent, GuidelineInput } from '@/types/post';

export interface NaverPublishPayload extends GuidelineInput, DraftContent {
  photoUrls: string[];
}

export async function publishToNaver(post: NaverPublishPayload) {
  try {
    // TODO: Playwright 또는 별도 자동화 서버를 연동해 네이버 자동발행을 구현하세요.
    // NAVER_ID, NAVER_PASSWORD는 서버 환경변수에서 읽어와 서버 측에서만 사용해야 합니다.
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { ok: true, message: `자동발행 준비 완료: ${post.title}` };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : '자동발행 실패' };
  }
}
