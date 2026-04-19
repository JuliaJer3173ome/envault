import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerTruncateCommand, truncateEntries } from './truncate';
import * as vault from '../../crypto/vault';

vi.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTruncateCommand(program);
  return program;
}

describe('truncateEntries', () => {
  it('removes specified keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    expect(truncateEntries(entries, ['A', 'C'])).toEqual({ B: '2' });
  });

  it('ignores missing keys gracefully', () => {
    const entries = { A: '1' };
    expect(truncateEntries(entries, ['B'])).toEqual({ A: '1' });
  });

  it('returns empty object when all keys removed', () => {
    expect(truncateEntries({ X: '1' }, ['X'])).toEqual({});
  });
});

describe('truncate command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('removes keys and writes vault', async () => {
    const entries = { FOO: 'bar', BAZ: 'qux' };
    vi.mocked(vault.openVault).mockResolvedValue({ entries } as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);
    const program = buildProgram();
    await program.parseAsync(['truncate', 'my.vault', 'FOO', '--password', 'secret', '--yes'], { from: 'user' });
    expect(vault.writeVault).toHaveBeenCalledWith('my.vault', expect.objectContaining({
      entries: { BAZ: 'qux' }
    }));
  });

  it('warns about missing keys but continues', async () => {
    const entries = { FOO: 'bar' };
    vi.mocked(vault.openVault).mockResolvedValue({ entries } as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['truncate', 'my.vault', 'FOO', 'MISSING', '--password', 'secret', '--yes'], { from: 'user' });
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('MISSING'));
  });

  it('exits with error on vault failure', async () => {
    vi.mocked(vault.openVault).mockRejectedValue(new Error('bad password'));
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(
      program.parseAsync(['truncate', 'my.vault', 'FOO', '--password', 'wrong', '--yes'], { from: 'user' })
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
