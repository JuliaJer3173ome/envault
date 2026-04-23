import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateEntries, ValidationResult } from './validate';

describe('validateEntries', () => {
  const schema = {
    DATABASE_URL: { required: true, type: 'string' },
    PORT: { required: false, type: 'number' },
    DEBUG: { type: 'boolean' },
    API_KEY: { required: true, pattern: '^[A-Za-z0-9]{32}$' },
  };

  it('marks required present fields as valid', () => {
    const entries = {
      DATABASE_URL: 'postgres://localhost/db',
      API_KEY: 'a'.repeat(32),
    };
    const results = validateEntries(entries, schema);
    const dbResult = results.find(r => r.key === 'DATABASE_URL');
    expect(dbResult?.valid).toBe(true);
  });

  it('marks required missing fields as invalid', () => {
    const entries = { PORT: '3000' };
    const results = validateEntries(entries, schema);
    const dbResult = results.find(r => r.key === 'DATABASE_URL');
    expect(dbResult?.valid).toBe(false);
    expect(dbResult?.reason).toMatch(/required/);
  });

  it('marks invalid number type as invalid', () => {
    const entries = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: 'not-a-number',
      API_KEY: 'a'.repeat(32),
    };
    const results = validateEntries(entries, schema);
    const portResult = results.find(r => r.key === 'PORT');
    expect(portResult?.valid).toBe(false);
    expect(portResult?.reason).toMatch(/number/);
  });

  it('marks valid number type as valid', () => {
    const entries = {
      DATABASE_URL: 'postgres://localhost/db',
      PORT: '8080',
      API_KEY: 'a'.repeat(32),
    };
    const results = validateEntries(entries, schema);
    const portResult = results.find(r => r.key === 'PORT');
    expect(portResult?.valid).toBe(true);
  });

  it('marks invalid boolean as invalid', () => {
    const entries = {
      DATABASE_URL: 'postgres://localhost/db',
      DEBUG: 'yes',
      API_KEY: 'a'.repeat(32),
    };
    const results = validateEntries(entries, schema);
    const debugResult = results.find(r => r.key === 'DEBUG');
    expect(debugResult?.valid).toBe(false);
  });

  it('accepts true/false/1/0 as boolean', () => {
    for (const val of ['true', 'false', '1', '0']) {
      const entries = {
        DATABASE_URL: 'postgres://localhost/db',
        DEBUG: val,
        API_KEY: 'a'.repeat(32),
      };
      const results = validateEntries(entries, schema);
      const debugResult = results.find(r => r.key === 'DEBUG');
      expect(debugResult?.valid).toBe(true);
    }
  });

  it('validates pattern correctly', () => {
    const entries = {
      DATABASE_URL: 'postgres://localhost/db',
      API_KEY: 'short',
    };
    const results = validateEntries(entries, schema);
    const apiResult = results.find(r => r.key === 'API_KEY');
    expect(apiResult?.valid).toBe(false);
    expect(apiResult?.reason).toMatch(/pattern/);
  });

  it('returns valid for optional missing keys', () => {
    const entries = {
      DATABASE_URL: 'postgres://localhost/db',
      API_KEY: 'a'.repeat(32),
    };
    const results = validateEntries(entries, schema);
    const portResult = results.find(r => r.key === 'PORT');
    expect(portResult?.valid).toBe(true);
  });
});
