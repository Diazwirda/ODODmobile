// getInitials: take first 1-2 words from name, take first char of each word, uppercase
// Examples: "John Doe" → "JD", "Alice" → "A", "  " → "" (empty string for whitespace-only)
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return '';
  if (words.length === 1) return words[0].charAt(0).toUpperCase();
  return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
}
