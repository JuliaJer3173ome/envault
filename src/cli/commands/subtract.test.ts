import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { subtractEntries, registerSubtractCommand } from './subtract';

// Mock the vault module
vi.mock('../../crypto/vault', () => ({
  openVault: vi.fn(),
  writeVault: vi.fn(),
}));

vi.mock('./init', () => ({
  promptPassword: vi.fn().mockResolvedValue('test-password'),
}));

import { openVault, writeVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSubtractCommand(program);
  return program;
}

describe('subtractEntries', () => {
  it('removes keys from source that exist in the reference set', () => {
    const source = { A: '1', B: '2', C: '3' };
    const reference = { B: 'x', C: 'y' };
    const result = subtractEntries(source, reference);
    expect(result).toEqual({ A: '1' });
  });

  it('returns all entries when reference is empty', () => {
    const source = { A: '1', B: '2' };
    const result = subtractEntries(source, {});
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('returns empty object when all keys are in reference', () => {
    const source = { A: '1', B: '2' };
    const reference = { A: 'x', B: 'y' };
    const result = subtractEntries(source, reference);
    expect(result).toEqual({});
  });

  it('ignores keys in reference that are not in source', () => {
    const source = { A: '1' };
    const reference = { B: '2', C: '3' };
    const result = subtractEntries(source, reference);
    expect(result).toEqual({ A: '1' });
  });
});

describe('subtract command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('subtracts keys from source vault using reference vault', async () => {
    vi.mocked(openVault)
      .mockResolvedValueOnce({ DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'secret' })
      .mockResolvedValueOnce({ DB_HOST: 'other', DB_PORT: '9999' });
    vi.mocked(writeVault).mockResolvedValue(undefined);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'subtract', 'source.vault', 'reference.vault']);

    expect(writeVault).toHaveBeenCalledWith(
      'source.vault',
      expect.any(String),
      { API_KEY: 'secret' }
    );
  });

  it('prints message when no keys are removed', async () => {
    vi.mocked(openVault)
      .mockResolvedValueOnce({ A: '1' })
      .mockResolvedValueOnce({ B: '2' });
    vi.mocked(writeVault).mockResolvedValue(undefined);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'subtract', 'source.vault', 'ref.vault']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No keys removed'));
    consoleSpy.mockRestore();
  });

  it('uses --dry-run flag to preview without writing', async () => {
    vi.mocked(openVault)
      .mockResolvedValueOnce({ A: '1', B: '2' })
      .mockResolvedValueOnce({ B: '9' });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'subtract', 'source.vault', 'ref.vault', '--dry-run']);

    expect(writeVault).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('B'));
    consoleSpy.mockRestore();
  });
});
