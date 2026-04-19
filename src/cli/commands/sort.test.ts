import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { sortEntries, registerSortCommand } from './sort';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSortCommand(program);
  return program;
}

describe('sortEntries', () => {
  it('sorts keys ascending by default', () => {
    const entries = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortEntries(entries);
    expect(Object.keys(result)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);
  });

  it('sorts keys descending', () => {
    const entries = { ZEBRA: '1', APPLE: '2', MANGO: '3' };
    const result = sortEntries(entries, 'desc');
    expect(Object.keys(result)).toEqual(['ZEBRA', 'MANGO', 'APPLE']);
  });

  it('preserves values', () => {
    const entries = { B: 'b', A: 'a' };
    const result = sortEntries(entries);
    expect(result).toEqual({ A: 'a', B: 'b' });
  });
});

describe('sort command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sorts and writes vault', async () => {
    const fakeVault = { entries: { Z: '1', A: '2' } };
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault as any);
    vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await buildProgram().parseAsync(['sort', 'vault.enc', '-p', 'pass'], { from: 'user' });

    expect(vault.writeVault).toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('2 entries'));
  });

  it('dry-run prints keys without writing', async () => {
    const fakeVault = { entries: { B: '1', A: '2' } };
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault as any);
    vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    await buildProgram().parseAsync(['sort', 'vault.enc', '-p', 'pass', '--dry-run'], { from: 'user' });

    expect(vault.writeVault).not.toHaveBeenCalled();
  });
});
