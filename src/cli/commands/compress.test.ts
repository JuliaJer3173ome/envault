import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { compressVault, decompressVault } from './compress';

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-compress-'));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('compressVault', () => {
  it('creates a .gz file from a vault', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    fs.writeFileSync(vaultPath, JSON.stringify({ entries: { KEY: 'value' } }));
    const out = compressVault(vaultPath);
    expect(out).toBe(vaultPath + '.gz');
    expect(fs.existsSync(out)).toBe(true);
  });

  it('compressed file is smaller or equal for small inputs', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    const content = JSON.stringify({ entries: { KEY: 'value'.repeat(100) } });
    fs.writeFileSync(vaultPath, content);
    const out = compressVault(vaultPath);
    const origSize = fs.statSync(vaultPath).size;
    const compSize = fs.statSync(out).size;
    expect(compSize).toBeLessThan(origSize);
  });
});

describe('decompressVault', () => {
  it('restores original vault content', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    const original = JSON.stringify({ entries: { FOO: 'bar' } });
    fs.writeFileSync(vaultPath, original);
    const gz = compressVault(vaultPath);
    fs.unlinkSync(vaultPath);
    const restored = decompressVault(gz);
    expect(fs.readFileSync(restored, 'utf-8')).toBe(original);
  });

  it('throws if file does not have .gz extension', () => {
    const vaultPath = path.join(tmpDir, 'test.vault');
    fs.writeFileSync(vaultPath, 'data');
    expect(() => decompressVault(vaultPath)).toThrow('.gz');
  });
});
