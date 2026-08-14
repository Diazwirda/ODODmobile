/**
 * Menghasilkan URL avatar dari foto atau placeholder dari inisial nama.
 */
export function getAvatarUri(
  photo?: string | null,
  name?: string,
): { uri: string } {
  if (photo) {
    return { uri: photo };
  }
  const initials = getInitials(name ?? '?');
  return {
    uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=3B82F6&color=fff&bold=true&size=128`,
  };
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (
    parts[0].charAt(0).toUpperCase() +
    parts[parts.length - 1].charAt(0).toUpperCase()
  );
}
