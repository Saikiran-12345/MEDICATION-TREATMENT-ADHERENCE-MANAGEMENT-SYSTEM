// ============================================================
// Cryptographic and Security Utilities
// Demo hashing, salting, checksum validation, token generation, data obfuscation
// ============================================================

/**
 * A simple, deterministic string hash function for demo purposes.
 * Returns a 32-bit FNV-1a hash representation.
 */
export function simpleHash(str: string): string {
  if (!str) return '00000000';
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by 32-bit FNV prime (16777619) using 32-bit bitwise multiplication
    hash = Math.imul(hash, 16777619);
  }
  // Convert unsigned integer to standard padded hexadecimal format
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Generate a random salt value.
 */
export function generateSalt(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let salt = '';
  // Fallback if window crypto is not loaded, but typically available
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomArray = new Uint8Array(16);
    window.crypto.getRandomValues(randomArray);
    for (let i = 0; i < randomArray.length; i++) {
      salt += chars[randomArray[i] % chars.length];
    }
  } else {
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return salt;
}

/**
 * Combine password and salt using a hashed process.
 */
export function hashPassword(password: string, salt: string): string {
  if (!password || !salt) return '';
  return simpleHash(password + salt + 'mtams_salt_pepper_2026');
}

/**
 * Verify if password matches the stored credentials hash.
 */
export function verifyPassword(password: string, salt: string, hash: string): boolean {
  if (!password || !salt || !hash) return false;
  return hashPassword(password, salt) === hash;
}

/**
 * Generate a checksum for data integrity verification (e.g. for backup verification).
 */
export function generateChecksum(data: string): string {
  if (!data) return '00000000';
  return simpleHash(data + '_checksum_salt');
}

/**
 * Verify checksum of a given dataset string.
 */
export function verifyChecksum(data: string, checksum: string): boolean {
  if (!data || !checksum) return false;
  return generateChecksum(data) === checksum;
}

/**
 * Generate a random alphanumeric token (useful for session mock IDs or tokens).
 */
export function generateToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const randomArray = new Uint8Array(length);
    window.crypto.getRandomValues(randomArray);
    for (let i = 0; i < randomArray.length; i++) {
      token += chars[randomArray[i] % chars.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return token;
}

/**
 * Reversible obfuscation helper for localStorage safety values.
 * Simple Base64 + custom char shifting (Vanilla implementation).
 */
export function obfuscateData(data: string): string {
  if (!data) return '';
  try {
    // Shifting character codes
    const shifted = data.split('').map(char => {
      return String.fromCharCode(char.charCodeAt(0) + 3);
    }).join('');
    
    if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
      return window.btoa(unescape(encodeURIComponent(shifted)));
    }
    
    // Fallback manual base64 implementation if btoa is unavailable
    return btoaManual(shifted);
  } catch (_) {
    return data;
  }
}

/**
 * Decode obfuscated data string.
 */
export function deobfuscateData(data: string): string {
  if (!data) return '';
  try {
    let decoded = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      decoded = decodeURIComponent(escape(window.atob(data)));
    } else {
      decoded = atobManual(data);
    }

    return decoded.split('').map(char => {
      return String.fromCharCode(char.charCodeAt(0) - 3);
    }).join('');
  } catch (_) {
    return data;
  }
}

// Minimal manual base64 encoder/decoder for environments where atob/btoa/Buffer are not loaded
const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function btoaManual(input: string): string {
  let str = input;
  let output = '';
  for (let block = 0, charCode, i = 0, map = B64_CHARS;
       str.charAt(i | 0) || (map = '=', i % 1);
       output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3/4);
    if (charCode > 0xFF) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
}

function atobManual(input: string): string {
  let str = input.replace(/=+$/, '');
  let output = '';
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, r1, r2, i = 0;
       i < str.length;
       i++) {
    r1 = B64_CHARS.indexOf(str.charAt(i));
    bs = bc % 4 ? bs * 64 + r1 : r1;
    r2 = bc++ % 4 ? 255 & bs >> (-2 * bc & 6) : 0;
    if (r2 !== 0 || i < str.length - 2) {
      output += String.fromCharCode(r2);
    }
  }
  return output;
}
