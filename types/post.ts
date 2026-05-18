export interface GuidelineInput {
  keyword: string;
  photoCount: number;
  guideline: string;
  mapLink: string;
  hashtags: string;
  tone: string;
}

export interface PlaceProfile {
  businessName: string;
  contact: string;
  address: string;
  placeLink: string;
  intro: string;
  category: string;
}

export interface DraftContent {
  title: string;
  body: string;
  mapLink: string;
  hashtags: string;
}

export interface FormatOptions {
  enableSubtitles: boolean;
  enableBold: boolean;
  enableHighlight: boolean;
  enableKeywordColor: boolean;
}

export type PublishStatus = 'idle' | 'publishing' | 'success' | 'failed';

export interface SavedPost extends GuidelineInput, DraftContent {
  id: string;
  photoUrls: string[];
  rawContent: string;
  formattedContent: string;
  created_at: string;
}
