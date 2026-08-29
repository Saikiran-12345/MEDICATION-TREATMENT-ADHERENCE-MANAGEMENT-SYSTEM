import { describe, it, expect } from 'vitest';
import {
  simpleHash,
  generateSalt,
  hashPassword,
  verifyPassword,
  generateChecksum,
  verifyChecksum,
  generateToken,
  obfuscateData,
  deobfuscateData,
} from './cryptoUtils';

describe('cryptoUtils', () => {
  describe('simpleHash', () => {
    it('should hash values deterministically', () => {
      const h1 = simpleHash('hello');
      const h2 = simpleHash('hello');
      const h3 = simpleHash('world');
      expect(h1).toBe(h2);
      expect(h1).not.toBe(h3);
      expect(h1.length).toBe(8);
    });
  });

  describe('generateSalt and password hashing', () => {
    it('should salten and verify password correctly', () => {
      const password = 'mySecretPassword123';
      const salt = generateSalt();
      expect(salt.length).toBe(16);

      const hash = hashPassword(password, salt);
      expect(hash).toBeDefined();

      const isValid = verifyPassword(password, salt, hash);
      expect(isValid).toBe(true);

      const isInvalid = verifyPassword('wrongpassword', salt, hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('checksum', () => {
    it('should sign and verify checksum integrity', () => {
      const json = JSON.stringify({ a: 1, b: 2 });
      const checksum = generateChecksum(json);
      expect(verifyChecksum(json, checksum)).toBe(true);
      expect(verifyChecksum(json + 'mod', checksum)).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should create custom length tokens', () => {
      const tok1 = generateToken(16);
      expect(tok1.length).toBe(16);
      
      const tok2 = generateToken(32);
      expect(tok2.length).toBe(32);
    });
  });

  describe('obfuscateData', () => {
    it('should reversibly obfuscate data values', () => {
      const plainText = 'Patient health profile: confidential details';
      const encrypted = obfuscateData(plainText);
      expect(encrypted).not.toBe(plainText);

      const decrypted = deobfuscateData(encrypted);
      expect(decrypted).toBe(plainText);
    });
  });
});
