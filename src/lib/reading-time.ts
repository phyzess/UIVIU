/**
 * Reading time for the homepage list.
 *
 * A deliberately simple estimate: CJK characters and Latin words are counted
 * separately because they read at very different speeds, and fenced code is
 * skipped (code is scanned, not read line by line). It is an estimate, so the
 * UI never presents it as anything more precise than "N min read".
 */

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/g;
const LATIN_WORD = /[A-Za-z0-9]+/g;

const CJK_PER_MINUTE = 400;
const WORDS_PER_MINUTE = 200;

export function estimateReadingMinutes(markdown: string): number {
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .trim();

  const cjkCount = (prose.match(CJK) ?? []).length;
  const wordCount = (prose.replace(CJK, " ").match(LATIN_WORD) ?? []).length;

  const minutes = cjkCount / CJK_PER_MINUTE + wordCount / WORDS_PER_MINUTE;

  return Math.max(1, Math.ceil(minutes));
}
