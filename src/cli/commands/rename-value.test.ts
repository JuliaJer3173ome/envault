import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { renameValue, registerRenameValueCommand } from './rename-value';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

vi.mock('../../crypto/vault');
vi.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRenameValueCommand(program);
  return program;
}

describe('renameValue', () => {
  it('replaces all matching values', () => {
    const entries = { A: 'foo', B: 'bar', C: 'foo' };
    const { updated, count } = renameValue(entries, 'foo', 'baz');
    expect(count).toBe(2);
    expect(updated.A).toBe('baz');
    expect(updated.B).toBe('bar');
    expect(updated.C).toBe('baz');
  });

  it('returns count 0 when no match', () => {
    const entries = { A: 'hello', B: 'world' };
    const { updated, count } = renameValue(entries, 'missing', 'new');
    expect(count).toBe(0);
    expect(updated).toEqual(entries);
  });

  it('does not mutate original entries', () => {
    const entries = { X: 'val' };
    renameValue(entries, 'val', 'new');
    expect(entries.X).toBe('val');
  });
});

describe('rename-value command', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('updates vault when matches found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(vault.openVault).mockResolvedValue({ KEY1: 'old', KEY2: 'keep' });
    vi.mocked(vault.updateVault).mockResolvedValue(undefined);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rename-value', 'my.vault', 'old', 'new', '--password', 'secret']);

    expect(vault.updateVault).toHaveBeenCalledWith('my.vault', 'secret', { KEY1: 'new', KEY2: 'keep' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('1 key(s)'));
  });

  it('reports no entries found when no match', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(vault.openVault).mockResolvedValue({ KEY1: 'something' });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rename-value', 'my.vault', 'missing', 'new', '--password', 'secret']);

    expect(vault.updateVault).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No entries found'));
  });

  it('previews changes in dry-run mode', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(vault.openVault).mockResolvedValue({ A: 'target', B: 'other' });

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'rename-value', 'my.vault', 'target', 'replaced', '--password', 'secret', '--dry-run']);

    expect(vault.updateVault).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[dry-run]'));
  });
});
