import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault } from '../../crypto/vault';
import {
  getExpireFilePath,
  readExpiry,
  writeExpiry,
  getExpiredKeys,
  registerExpireCommand,
} from './expire';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExpireCommand(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;
const password = 'test-pass';

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expire-test-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  await createVault(vaultPath, { KEY1: 'val1', KEY2: 'val2' }, password);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readExpiry / writeExpiry', () => {
  it('returns empty object when no expiry file', () => {
    expect(readExpiry(vaultPath)).toEqual({});
  });

  it('writes and reads expiry data', () => {
    writeExpiry(vaultPath, { KEY1: '2099-01-01T00:00:00.000Z' });
    expect(readExpiry(vaultPath)).toEqual({ KEY1: '2099-01-01T00:00:00.000Z' });
  });
});

describe('getExpiredKeys', () => {
  it('returns keys past their expiry date', () => {
    writeExpiry(vaultPath, {
      KEY1: '2000-01-01T00:00:00.000Z',
      KEY2: '2099-01-01T00:00:00.000Z',
    });
    expect(getExpiredKeys(vaultPath)).toEqual(['KEY1']);
  });
});

describe('expire command', () => {
  it('sets expiry for a key', async () => {
    const program = buildProgram();
    await program.parseAsync(['expire', vaultPath, 'KEY1', '2099-06-01T00:00:00Z', '-p', password], { from: 'user' });
    const expiry = readExpiry(vaultPath);
    expect(expiry['KEY1']).toBe('2099-06-01T00:00:00.000Z');
  });

  it('rejects invalid datetime', async () => {
    const program = buildProgram();
    await expect(
      program.parseAsync(['expire', vaultPath, 'KEY1', 'not-a-date', '-p', password], { from: 'user' })
    ).rejects.toThrow();
  });
});

describe('expire-check command', () => {
  it('reports expired keys', async () => {
    writeExpiry(vaultPath, { KEY1: '2000-01-01T00:00:00.000Z' });
    const program = buildProgram();
    const logs: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((...a) => logs.push(a.join(' ')));
    await program.parseAsync(['expire-check', vaultPath, '-p', password], { from: 'user' });
    expect(logs.some(l => l.includes('KEY1'))).toBe(true);
  });
});
