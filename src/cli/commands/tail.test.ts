import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerTailCommand, tailEntries } from './tail';
import * as crypto from '../../crypto';
import * as fs from 'fs';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTailCommand(program);
  return program;
}

describe('tailEntries', () => {
  it('returns last N entries', () => {
    const entries = { A: '1', B: '2', C: '3', D: '4' };
    const result = tailEntries(entries, 2);
    expect(Object.keys(result)).toEqual(['C', 'D']);
  });

  it('returns all entries if N >= length', () => {
    const entries = { A: '1', B: '2' };
    const result = tailEntries(entries, 10);
    expect(Object.keys(result)).toHaveLength(2);
  });

  it('returns empty if entries are empty', () => {
    expect(tailEntries({}, 5)).toEqual({});
  });
});

describe('tail command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints last N entries', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(crypto, 'openVault').mockResolvedValue({
      entries: { A: '1', B: '2', C: '3' },
    } as any);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'tail', 'vault.ev', '-n', '2', '-p', 'pass']);
    expect(log).toHaveBeenCalledWith('B=2');
    expect(log).toHaveBeenCalledWith('C=3');
    expect(log).not.toHaveBeenCalledWith('A=1');
  });

  it('errors if vault not found', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(false);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'tail', 'missing.ev', '-p', 'pass'])
    ).rejects.toThrow();
    expect(err).toHaveBeenCalledWith(expect.stringContaining('not found'));
  });
});
