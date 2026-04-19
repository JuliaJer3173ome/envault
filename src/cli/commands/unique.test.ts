import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerUniqueCommand, findDuplicateValues, filterUniqueEntries } from './unique';
import * as crypto from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerUniqueCommand(program);
  return program;
}

describe('findDuplicateValues', () => {
  it('returns keys sharing the same value', () => {
    const entries = { A: 'foo', B: 'foo', C: 'bar' };
    const dupes = findDuplicateValues(entries);
    expect(dupes['foo']).toEqual(['A', 'B']);
    expect(dupes['bar']).toBeUndefined();
  });

  it('returns empty object when no duplicates', () => {
    expect(findDuplicateValues({ A: '1', B: '2' })).toEqual({});
  });
});

describe('filterUniqueEntries', () => {
  it('keeps only first occurrence of each value', () => {
    const entries = { A: 'foo', B: 'foo', C: 'bar' };
    const result = filterUniqueEntries(entries);
    expect(result).toEqual({ A: 'foo', C: 'bar' });
  });

  it('returns all entries when all values are unique', () => {
    const entries = { A: '1', B: '2' };
    expect(filterUniqueEntries(entries)).toEqual(entries);
  });
});

describe('unique command', () => {
  beforeEach(() => {
    vi.spyOn(crypto, 'openVault').mockResolvedValue({
      entries: { KEY1: 'val1', KEY2: 'val1', KEY3: 'val2' },
    } as any);
  });

  it('prints unique entries by default', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'unique', 'vault.env', '-p', 'pass']);
    expect(log).toHaveBeenCalledWith('KEY1=val1');
    expect(log).toHaveBeenCalledWith('KEY3=val2');
    log.mockRestore();
  });

  it('prints duplicates with --duplicates flag', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'unique', 'vault.env', '-p', 'pass', '--duplicates']);
    expect(log).toHaveBeenCalledWith(expect.stringContaining('KEY1'));
    log.mockRestore();
  });

  it('handles vault error', async () => {
    vi.spyOn(crypto, 'openVault').mockRejectedValue(new Error('bad password'));
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(buildProgram().parseAsync(['node', 'test', 'unique', 'vault.env', '-p', 'wrong'])).rejects.toThrow();
    expect(err).toHaveBeenCalledWith('Error: bad password');
    err.mockRestore();
    exit.mockRestore();
  });
});
