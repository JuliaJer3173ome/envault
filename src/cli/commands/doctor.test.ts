import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { diagnoseVault } from './doctor';
import * as lockModule from './lock';
import * as ttlModule from './ttl';

vi.mock('fs');
vi.mock('./lock');
vi.mock('./ttl');

const VAULT = '/tmp/test.vault';

beforeEach(() => {
  vi.mocked(lockModule.readLocks).mockReturnValue({});
  vi.mocked(ttlModule.readTtls).mockReturnValue({});
  vi.mocked(ttlModule.getExpiredKeys).mockReturnValue([]);
});

afterEach(() => vi.clearAllMocks());

describe('diagnoseVault', () => {
  it('reports missing file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = diagnoseVault(VAULT);
    expect(result.readable).toBe(false);
    expect(result.warnings).toContain('Vault file does not exist.');
  });

  it('reports empty file', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 0 } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('{}');
    const result = diagnoseVault(VAULT);
    expect(result.warnings).toContain('Vault file is empty.');
  });

  it('reports corrupted JSON', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 100 } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('not json {{');
    const result = diagnoseVault(VAULT);
    expect(result.readable).toBe(false);
    expect(result.warnings.some(w => w.includes('corrupted'))).toBe(true);
  });

  it('reports locked vault', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 50 } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('{"entries":{}}');
    vi.mocked(lockModule.readLocks).mockReturnValue({ [path.resolve(VAULT)]: true });
    const result = diagnoseVault(VAULT);
    expect(result.locked).toBe(true);
    expect(result.warnings).toContain('Vault is currently locked.');
  });

  it('reports expired keys', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 50 } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('{"entries":{}}');
    vi.mocked(ttlModule.readTtls).mockReturnValue({ KEY1: 1000 });
    vi.mocked(ttlModule.getExpiredKeys).mockReturnValue(['KEY1']);
    const result = diagnoseVault(VAULT);
    expect(result.expiredKeys).toContain('KEY1');
    expect(result.warnings.some(w => w.includes('expired'))).toBe(true);
  });

  it('passes all checks for healthy vault', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.statSync).mockReturnValue({ size: 50 } as fs.Stats);
    vi.mocked(fs.readFileSync).mockReturnValue('{"entries":{}}');
    const result = diagnoseVault(VAULT);
    expect(result.readable).toBe(true);
    expect(result.locked).toBe(false);
    expect(result.expiredKeys).toHaveLength(0);
    expect(result.warnings).toHaveLength(0);
  });
});
