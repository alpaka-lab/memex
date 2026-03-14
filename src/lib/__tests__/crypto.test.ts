import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.stubEnv('BETTER_AUTH_SECRET', 'test-secret-key-for-testing-only');
});

describe('crypto', () => {
  it('encrypts and decrypts a string', async () => {
    const { encrypt, decrypt } = await import('../crypto');
    const plaintext = 'sk-ant-api03-my-secret-key';
    const encrypted = encrypt(plaintext);

    expect(encrypted).not.toBe(plaintext);
    expect(encrypted).toMatch(/^[A-Za-z0-9+/=]+$/); // base64

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('produces different ciphertexts for the same input (random IV)', async () => {
    const { encrypt } = await import('../crypto');
    const plaintext = 'same-key';
    const a = encrypt(plaintext);
    const b = encrypt(plaintext);
    expect(a).not.toBe(b);
  });

  it('throws on tampered ciphertext', async () => {
    const { encrypt, decrypt } = await import('../crypto');
    const encrypted = encrypt('secret');
    const tampered = encrypted.slice(0, -2) + 'XX';
    expect(() => decrypt(tampered)).toThrow();
  });

  it('handles empty string', async () => {
    const { encrypt, decrypt } = await import('../crypto');
    const encrypted = encrypt('');
    expect(decrypt(encrypted)).toBe('');
  });

  it('handles unicode', async () => {
    const { encrypt, decrypt } = await import('../crypto');
    const plaintext = 'Hello \u{1F512} key with émojis';
    expect(decrypt(encrypt(plaintext))).toBe(plaintext);
  });
});
