import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { computeChecksum, verifyChecksum, registerChecksumCommand } from './checksum';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerChecksumCommand(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-checksum-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  fs.writeFileSync(vaultPath, 'hello world');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('computeChecksum', () => {
  it('returns a 64-char hex string', () => {
    const hash = computeChecksum(vaultPath);
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]+$/);
  });

  it('is deterministic', () => {
    expect(computeChecksum(vaultPath)).toBe(computeChecksum(vaultPath));
  });

  it('changes when file content changes', () => {
    const before = computeChecksum(vaultPath);
    fs.writeFileSync(vaultPath, 'different content');
    expect(computeChecksum(vaultPath)).not.toBe(before);
  });
});

describe('verifyChecksum', () => {
  it('returns true for matching checksum', () => {
    const hash = computeChecksum(vaultPath);
    expect(verifyChecksum(vaultPath, hash)).toBe(true);
  });

  it('returns false for wrong checksum', () => {
    expect(verifyChecksum(vaultPath, 'deadbeef'.repeat(8))).toBe(false);
  });
});

describe('checksum show command', () => {
  it('prints checksum without error', () => {
    const program = buildProgram();
    const logs: string[] = [];
    const spy = vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    program.parse(['node', 'envault', 'checksum', 'show', vaultPath]);
    expect(logs[0]).toContain(computeChecksum(vaultPath));
    spy.mockRestore();
  });
});
