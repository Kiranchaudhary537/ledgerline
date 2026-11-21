/** Number of category colours (--cat-1 … --cat-6 in index.css). */
export const TONE_COUNT = 6;

/** Stable 0..TONE_COUNT-1 for a text, so the same person or department always gets the same colour. */
export function toneOf(text: string) {
  let hash = 0;
  for (const ch of text) hash = (hash * 31 + ch.codePointAt(0)!) % 100_003;
  return hash % TONE_COUNT;
}
