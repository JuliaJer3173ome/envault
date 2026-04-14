import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from './encryption';
import * as crypto from 'crypto';

describe('encryption', () => {
  const password = 'super-secret-password';
  const plaintext = 'DATABASE_URL=postgres://localhost/mydb\nAPI_KEY=abc123';

  it('should encrypt and decrypt a string successfully', () => {
    const payload = encrypt(plaintext, password);
    const result = decrypt(payload, password);
    expect(result).toBe(plaintext);
  });

  it('should produce different ciphertexts for the same input', () => {
    const payload1 = encrypt(plaintext, password);
    const payload2 = encrypt(plaintext, password);
    expect(payload1.ciphertext).not.toBe(payload2.ciphertext);
    expect(payload1.iv).not.toBe(payload2.iv);
    expect(payload1.salt).not.toBe(payload2.salt);
  });

  it('should fail to decrypt with wrong password', () => {
    const payload = encrypt(plaintext, password);
    expect(() => decrypt(payload, 'wrong-password')).toThrow();
  });

  it('should fail to decrypt with tampered ciphertext', () => {
    const payload = encrypt(plaintext, password);
    const tampered = { ...payload, ciphertext: payload.ciphertext.slice(0, -2) + 'ff' };
    expect(() => decrypt(tampered, password)).toThrow();
  });

  it('should derive consistent keys from same password and salt', () => {
    const salt = crypto.randomBytes(64);
    const key1 = deriveKey(password, salt);
    const key2 = deriveKey(password, salt);
    expect(key1.equals(key2)).toBe(true);
  });

  it('should produce different keys for different salts', () => {
    const salt1 = crypto.randomBytes(64);
    const salt2 = crypto.randomBytes(64);
    const key1 = deriveKey(password, salt1);
    const key2 = deriveKey(password, salt2);
    expect(key1.equals(key2)).toBe(false);
  });

  it('should handle empty string plaintext', () => {
    const payload = encrypt('', password);
    const result = decrypt(payload, password);
    expect(result).toBe('');
  });
});
