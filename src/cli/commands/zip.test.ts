import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerZipCommand, zipEntries } from './zip';

vi.mock('../../crypto/vault', () => ({
  openVault: vi.fn(),
  writeVault: vi.fn(),
}));

vi.mock('./zip', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./zip')>();
  return { ...mod, promptPassword: vi.fn().mockResolvedValue('secret') };
});

import { openVault, writeVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerZipCommand(program);
  return program;
}

describe('zipEntries', () => {
  it('interleaves entries from two records', () => {
    const a = { KEY_A: 'val_a', KEY_C: 'val_c' };
    const b = { KEY_B: 'val_b', KEY_D: 'val_d' };
    const result = zipEntries(a, b);
    const keys = Object.keys(result);
    expect(keys).toContain('KEY_A');
    expect(keys).toContain('KEY_B');
    expect(keys).toContain('KEY_C');
    expect(keys).toContain('KEY_D');
  });

  it('handles unequal length vaults', () => {
    const a = { A: '1', B: '2', C: '3' };
    const b = { X: '9' };
    const result = zipEntries(a, b);
    expect(Object.keys(result)).toHaveLength(4);
  });

  it('returns empty object for two empty inputs', () => {
    expect(zipEntries({}, {})).toEqual({});
  });
});

describe('zip command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('opens both vaults and writes zipped output', async () => {
    vi.mocked(openVault)
      .mockResolvedValueOnce({ KEY_A: 'val_a' })
      .mockResolvedValueOnce({ KEY_B: 'val_b' });
    vi.mocked(writeVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'zip', 'a.vault', 'b.vault', 'out.vault', '-p', 'secret']);

    expect(openVault).toHaveBeenCalledTimes(2);
    expect(writeVault).toHaveBeenCalledTimes(1);
  });

  it('exits with code 1 on vault open error', async () => {
    vi.mocked(openVault).mockRejectedValueOnce(new Error('bad password'));
    const program = buildProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'zip', 'a.vault', 'b.vault', 'out.vault', '-p', 'wrong'])
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
