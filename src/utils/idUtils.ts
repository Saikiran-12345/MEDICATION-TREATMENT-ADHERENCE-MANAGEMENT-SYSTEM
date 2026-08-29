// ============================================================
// ID Generation Utilities
// Deterministic and random identifier generation for all entities
// ============================================================

/**
 * Generate a prefixed ID with timestamp and random suffix.
 * Format: {prefix}-{timestamp}-{random3digits}
 */
export function generateId(prefix: string): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Generate a v4-like UUID string.
 * Uses crypto.getRandomValues when available, falls back to Math.random.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32),
    ].join('-');
  }

  // Fallback using Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate that an ID string matches the expected format.
 * If prefix is provided, checks that the ID starts with that prefix.
 */
export function isValidId(id: string, prefix?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  if (prefix) {
    return id.startsWith(`${prefix}-`) && id.length > prefix.length + 1;
  }
  // General format: at least one segment separated by hyphens
  return /^[a-zA-Z]+-\d+(-\d+)?$/.test(id) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(id);
}

/**
 * Extract the timestamp portion from a generated ID.
 * Returns null if the ID format doesn't contain a valid timestamp.
 */
export function extractTimestamp(id: string): number | null {
  if (!id || typeof id !== 'string') return null;
  const parts = id.split('-');
  if (parts.length >= 2) {
    const timestamp = parseInt(parts[1], 10);
    if (!isNaN(timestamp) && timestamp > 1_000_000_000_000) {
      return timestamp;
    }
  }
  return null;
}

/**
 * Generate a sequential ID with prefix and padded number.
 * e.g. generateSequentialId('pat', 5) => 'pat-5'
 */
export function generateSequentialId(prefix: string, sequence: number): string {
  return `${prefix}-${sequence}`;
}
