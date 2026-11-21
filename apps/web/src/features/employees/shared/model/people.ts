/** "Sandeep Singh" → "SS"; one word → its first two letters. */
export function initials(fullName: string) {
  const words = fullName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  const first = words[0]!;
  const letters =
    words.length === 1 ? first.slice(0, 2) : first.charAt(0) + words[words.length - 1]!.charAt(0);
  return letters.toUpperCase();
}
