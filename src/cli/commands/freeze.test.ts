import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import {
  readFrozen,
  writeFrozen,
  freezeKey,
  unfreezeKey,
  isFrozen,
  registerFreezeCommand,
} from './freeze';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerFreezeCommand(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-freeze-'));
  vaultPath = path.join(tmpDir, 'test.vault');
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('readFrozen', () => {
  it('returns empty array when freeze file does not exist', () => {
    expect(readFrozen(vaultPath)).toEqual([]);
  });

  it('returns parsed keys from freeze file', () => {
    writeFrozen(vaultPath, ['KEY_A', 'KEY_B']);
    expect(readFrozen(vaultPath)).toEqual(['KEY_A', 'KEY_B']);
  });
});

describe('freezeKey / unfreezeKey / isFrozen', () => {
  it('freezes a key', () => {
    freezeKey(vaultPath, 'MY_KEY');
    expect(isFrozen(vaultPath, 'MY_KEY')).toBe(true);
  });

  it('does not duplicate frozen keys', () => {
    freezeKey(vaultPath, 'MY_KEY');
    freezeKey(vaultPath, 'MY_KEY');
    expect(readFrozen(vaultPath)).toHaveLength(1);
  });

  it('unfreezes a key', () => {
    freezeKey(vaultPath, 'MY_KEY');
    unfreezeKey(vaultPath, 'MY_KEY');
    expect(isFrozen(vaultPath, 'MY_KEY')).toBe(false);
  });

  it('returns false for non-frozen key', () => {
    expect(isFrozen(vaultPath, 'UNKNOWN')).toBe(false);
  });
});

describe('registerFreezeCommand', () => {
  it('freezes a key via CLI', () => {
    const program = buildProgram();
    program.parse(['freeze', vaultPath, 'API_KEY'], { from: 'user' });
    expect(isFrozen(vaultPath, 'API_KEY')).toBe(true);
  });

  it('unfreezes a key via CLI --unfreeze', () => {
    freezeKey(vaultPath, 'API_KEY');
    const program = buildProgram();
    program.parse(['freeze', vaultPath, 'API_KEY', '--unfreeze'], { from: 'user' });
    expect(isFrozen(vaultPath, 'API_KEY')).toBe(false);
  });
});
