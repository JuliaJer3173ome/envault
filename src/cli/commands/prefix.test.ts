import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { prefixEntries, registerPrefixCommand } from './prefix';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPrefixCommand(program);
  return program;
}

describe('prefixEntries', () => {
  it('adds prefix to all keys', () => {
    const result = prefixEntries({ FOO: '1', BAR: '2' }, 'APP_');
    expect(result).toEqual({ APP_FOO: '1', APP_BAR: '2' });
  });

  it('returns empty object for empty input', () => {
    expect(prefixEntries({}, 'X_')).toEqual({});
  });
});

describe('prefix command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds prefix to vault keys', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { FOO: 'bar', BAZ: 'qux' },
    } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'prefix', 'vault.ev', 'APP_', '--password', 'secret']);

    expect(writeSpy).toHaveBeenCalledWith(
      'vault.ev',
      expect.objectContaining({ entries: { APP_FOO: 'bar', APP_BAZ: 'qux' } }),
      'secret'
    );
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Added prefix "APP_"'));
  });

  it('strips prefix from vault keys', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { APP_FOO: 'bar', APP_BAZ: 'qux' },
    } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'prefix', 'vault.ev', 'APP_', '--password', 'secret', '--strip']);

    expect(writeSpy).toHaveBeenCalledWith(
      'vault.ev',
      expect.objectContaining({ entries: { FOO: 'bar', BAZ: 'qux' } }),
      'secret'
    );
  });

  it('exits with error when password is missing', async () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'prefix', 'vault.ev', 'APP_'])
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
