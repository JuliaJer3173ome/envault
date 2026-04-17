import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { setTtl, readTtls, getExpiredKeys, getTtlFilePath } from './ttl';

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ttl-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('setTtl', () => {
  it('creates a TTL entry for a key', () => {
    setTtl(vaultPath, 'API_KEY', 3600);
    const ttls = readTtls(vaultPath);
    expect(ttls).toHaveLength(1);
    expect(ttls[0].key).toBe('API_KEY');
    expect(ttls[0].vaultPath).toBe(vaultPath);
    expect(ttls[0].expiresAt).toBeGreaterThan(Date.now());
  });

  it('overwrites existing TTL for the same key', () => {
    setTtl(vaultPath, 'API_KEY', 3600);
    setTtl(vaultPath, 'API_KEY', 7200);
    const ttls = readTtls(vaultPath);
    expect(ttls).toHaveLength(1);
  });

  it('stores multiple keys independently', () => {
    setTtl(vaultPath, 'KEY_A', 100);
    setTtl(vaultPath, 'KEY_B', 200);
    expect(readTtls(vaultPath)).toHaveLength(2);
  });
});

describe('getExpiredKeys', () => {
  it('returns empty array when no keys expired', () => {
    setTtl(vaultPath, 'FRESH_KEY', 9999);
    expect(getExpiredKeys(vaultPath)).toEqual([]);
  });

  it('detects expired keys', () => {
    const ttlFile = getTtlFilePath(vaultPath);
    const expired = [{ vaultPath, key: 'OLD_KEY', expiresAt: Date.now() - 1000 }];
    fs.writeFileSync(ttlFile, JSON.stringify(expired));
    expect(getExpiredKeys(vaultPath)).toContain('OLD_KEY');
  });

  it('returns empty when no TTL file exists', () => {
    expect(getExpiredKeys(vaultPath)).toEqual([]);
  });
});

describe('readTtls', () => {
  it('returns empty array when file does not exist', () => {
    expect(readTtls(vaultPath)).toEqual([]);
  });
});
