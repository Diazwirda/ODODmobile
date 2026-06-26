// Extract google_token from URL fragment: #google_token=TOKEN
// Return null for google_error or unknown fragments
export function extractGoogleToken(url: string): string | null {
  try {
    // Handle fragment (#) extraction
    const hashIndex = url.indexOf('#');
    if (hashIndex === -1) return null;
    const fragment = url.substring(hashIndex + 1);
    const params = new URLSearchParams(fragment);
    const token = params.get('google_token');
    return token ?? null;
  } catch {
    return null;
  }
}
