// ============================================================
// String Utilities
// Text manipulation, formatting, and sanitisation helpers
// ============================================================

/**
 * Capitalise the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a string to Title Case (each word capitalised).
 */
export function titleCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(/[\s_-]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert a string to a URL-friendly slug.
 */
export function slugify(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Truncate a string to a maximum length, appending a suffix (default: '…').
 */
export function truncate(str: string, maxLength: number, suffix: string = '…'): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.slice(0, maxLength - suffix.length).trimEnd() + suffix;
}

/**
 * Extract initials from a name string.
 * e.g. 'John Doe' => 'JD', 'Alice Bob Charles' => 'AC' (maxChars=2)
 */
export function getInitials(name: string, maxChars: number = 2): string {
  if (!name) return '';
  const words = name.trim().split(/\s+/);
  const initials = words.map(w => w.charAt(0).toUpperCase());
  if (maxChars === 1) return initials[0] || '';
  if (initials.length === 1) return initials[0];
  return (initials[0] + initials[initials.length - 1]).slice(0, maxChars);
}

/**
 * Wrap matching substrings in <mark> tags for search highlighting.
 * Returns HTML string — use with dangerouslySetInnerHTML.
 */
export function highlightMatch(text: string, query: string): string {
  if (!text || !query) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800/50 rounded px-0.5">$1</mark>');
}

/**
 * Pluralise a word based on count.
 * e.g. pluralize(1, 'patient') => '1 patient', pluralize(5, 'patient') => '5 patients'
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural || singular + 's');
  return `${count} ${word}`;
}

/**
 * Escape HTML entities to prevent XSS.
 */
export function sanitizeHtml(str: string): string {
  if (!str) return '';
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
    '/': '&#x2F;',
  };
  return str.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Mask an email address for privacy display.
 * e.g. 'john.doe@example.com' => 'jo***@example.com'
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

/**
 * Mask a phone number for privacy display.
 * e.g. '555-123-4567' => '555-***-4567'
 */
export function maskPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 7) return phone;
  const visible = digits.slice(0, 3) + '***' + digits.slice(-4);
  return visible;
}

/**
 * Convert a string to kebab-case.
 */
export function toKebabCase(str: string): string {
  if (!str) return '';
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert a string to camelCase.
 */
export function toCamelCase(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''));
}

/**
 * Normalise whitespace: collapse multiple spaces, trim.
 */
export function normalizeWhitespace(str: string): string {
  if (!str) return '';
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Case-insensitive string containment check.
 */
export function containsIgnoreCase(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

/**
 * Remove accents / diacritics from a string for normalised searching.
 */
export function removeDiacritics(str: string): string {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Join an array of strings with a conjunction.
 * e.g. joinWithConjunction(['A', 'B', 'C'], 'and') => 'A, B, and C'
 */
export function joinWithConjunction(items: string[], conjunction: string = 'and'): string {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, ${conjunction} ${items[items.length - 1]}`;
}
