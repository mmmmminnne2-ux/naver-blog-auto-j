import type { FormatOptions } from '@/types/post';

const COLOR_KEYWORDS = [
  '위치',
  '접근성',
  '가격',
  '시설',
  '장점',
  '후기',
  '주차',
  '교통',
  '거리',
  '가성비'
];

function escapeHtml(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function sentenceSplit(text: string) {
  return text.split(/(?<=[.!?。！？])\s+|\n+/).map((v) => v.trim()).filter(Boolean);
}

function highlightKeywords(line: string) {
  let out = line;
  for (const keyword of COLOR_KEYWORDS) {
    const regex = new RegExp(`(${keyword})`, 'g');
    out = out.replace(regex, '<span class="keyword-highlight">$1</span>');
  }
  return out;
}

export function formatPostContent(rawContent: string, options: FormatOptions) {
  const paragraphs = rawContent.split(/\n{2,}/).map((v) => v.trim()).filter(Boolean);
  const sectionTitles = ['1. 위치 & 접근성', '2. 공간 구성 & 시설', '3. 이용 후기', '4. 총평'];

  const chunkSize = Math.max(1, Math.ceil(paragraphs.length / 4));
  const sections: string[] = [];

  for (let i = 0; i < paragraphs.length; i += chunkSize) {
    const group = paragraphs.slice(i, i + chunkSize);
    const title = sectionTitles[Math.min(sections.length, sectionTitles.length - 1)];

    const htmlParagraphs = group
      .map((p) => {
        const sentences = sentenceSplit(p);
        const importantIndex = sentences.length > 2 ? 1 : 0;
        const emphasisIndex = sentences.length > 3 ? 2 : sentences.length - 1;

        const transformed = sentences.map((sentence, idx) => {
          let line = escapeHtml(sentence);
          if (options.enableKeywordColor) {
            line = highlightKeywords(line);
          }
          if (options.enableBold && idx === importantIndex) {
            line = `<strong>${line}</strong>`;
          }
          if (options.enableHighlight && idx === emphasisIndex) {
            line = `<mark>${line}</mark>`;
          }
          return line;
        });

        return `<p>${transformed.join(' ')}</p>`;
      })
      .join('');

    sections.push(`${options.enableSubtitles ? `<h2>${title}</h2>` : ''}${htmlParagraphs}`);
  }

  return sections.join('');
}
