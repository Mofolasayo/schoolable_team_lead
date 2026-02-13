/**
 * Avatar utilities for Team Lead Dashboard
 */

/**
 * Generate avatar URL for a user based on their profile information
 */
export function getAvatarUrl(profile: {
  avatar_url?: string | null;
  gender?: string | null;
  employee_id?: string | null;
  email?: string | null;
  full_name?: string | null;
  employeeName?: string | null;
}): string {
  // Use custom avatar if provided
  if (profile.avatar_url && profile.avatar_url.length > 0) {
    return profile.avatar_url;
  }

  // Generate seed from available identifiers
  const seed =
    profile.employee_id ||
    profile.email ||
    profile.full_name ||
    profile.employeeName ||
    'default';
  const gender = profile.gender?.toLowerCase();

  let style = 'bottts';
  if (gender === 'male') {
    style = 'adventurer';
  } else if (gender === 'female') {
    style = 'adventurer-neutral';
  }

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) return '?';
  if (parts.length === 1 || !last) return first.charAt(0).toUpperCase();
  return (first.charAt(0) + last.charAt(0)).toUpperCase();
}
