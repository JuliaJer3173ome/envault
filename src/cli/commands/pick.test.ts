import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { pickEntries, registerPickCommand } from './pick';
import * as vault from '../../crypto/vault';
import * as init from './init';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPickCommand(program);
  return program;
}

describe('pickEntries', () => {
  it('returns only the specified keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    expect(pickEntries(entries, ['A', 'C'])).toEqual({ A: '1', C: '3' });
  });

  it('ignores keys that do not exist', () => {
    const entries = { A: '1', B: '2' };
    expect(pickEntries(entries, ['A', 'Z'])).toEqual({ A: '1' });
  });

  it('returns empty object when no keys match', () => {
    const entries = { A: '1' };
    expect(pickEntries(entries, ['X', 'Y'])).toEqual({});
  });

  it('returns all entries when all keys specified', () => {
    const entries = { A: '1', B: '2' };
    expect(pickEntries(entries, ['A', 'B'])).toEqual({ A: '1', B: '2' });
  });
});

describe('pick command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes vault with only picked keys', async () => {
    vi.spyOn(init, 'promptPassword').mockResolvedValue('secret');
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { A: '1', B: '2', C: '3' },
    } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await buildProgram().parseAsync(['node', 'test', 'pick', 'vault.env', 'A', 'C']);

    expect(writeSpy).toHaveBeenCalledWith(
      'vault.env',
      expect.objectContaining({ entries: { A: '1', C: '3' } }),
      'secret'
    );
    expect(consoleSpy).toHaveBeenCalledWith('Kept 2 key(s) in vault.');
  });

  it('warns about missing keys', async () => {
    vi.spyOn(init, 'promptPassword').mockResolvedValue('secret');
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { A: '1' } } as any);
    vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await buildProgram().parseAsync(['node', 'test', 'pick', 'vault.env', 'A', 'Z']);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Z'));
  });

  it('dry-run does not write vault', async () => {
    vi.spyOn(init, 'promptPassword').mockResolvedValue('secret');
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { A: '1', B: '2' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await buildProgram().parseAsync(['node', 'test', 'pick', 'vault.env', 'A', '--dry-run']);

    expect(writeSpy).not.toHaveBeenCalled();
  });
});
