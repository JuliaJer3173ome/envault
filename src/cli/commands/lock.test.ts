import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import { readLocks, writeLocks, lockVault, unlockVault, isLocked, registerLockCommand } from './lock';

vi.mock('fs');

const mockFs = vi.mocked(fs);

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLockCommand(program);
  return program;
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe('readLocks', () => {
  it('returns empty object if lock file does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);
    expect(readLocks()).toEqual({});
  });

  it('returns parsed locks from file', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(JSON.stringify({ '/some/vault.env': 1234567890 }));
    expect(readLocks()).toEqual({ '/some/vault.env': 1234567890 });
  });
});

describe('lockVault / unlockVault / isLocked', () => {
  it('locks and detects a vault as locked', () => {
    mockFs.existsSync.mockReturnValue(false);
    let stored: string = '{}';
    mockFs.writeFileSync.mockImplementation((_p, data) => { stored = data as string; });
    mockFs.readFileSync.mockImplementation(() => stored);

    lockVault('/test/vault.env');
    mockFs.existsSync.mockReturnValue(true);
    expect(isLocked('/test/vault.env')).toBe(true);
  });

  it('unlocks a vault', () => {
    let stored = JSON.stringify({ '/test/vault.env': 123 });
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockImplementation(() => stored);
    mockFs.writeFileSync.mockImplementation((_p, data) => { stored = data as string; });

    unlockVault('/test/vault.env');
    expect(isLocked('/test/vault.env')).toBe(false);
  });
});

describe('lock command', () => {
  it('locks a vault via CLI', async () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('{}');
    mockFs.mkdirSync.mockImplementation(() => undefined);
    mockFs.writeFileSync.mockImplementation(() => {});
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['lock', 'on', 'vault.env'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('locked'));
  });
});
