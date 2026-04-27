import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { summarizeEntries, formatSummary, registerSummarizeCommand } from './summarize';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSummarizeCommand(program);
  return program;
}

describe('summarizeEntries', () => {
  it('returns zero stats for empty entries', () => {
    const result = summarizeEntries({});
    expect(result.totalKeys).toBe(0);
    expect(result.emptyValues).toBe(0);
    expect(result.uniqueValues).toBe(0);
  });

  it('counts total keys correctly', () => {
    const result = summarizeEntries({ A: 'foo', B: 'bar', C: '' });
    expect(result.totalKeys).toBe(3);
  });

  it('counts empty values', () => {
    const result = summarizeEntries({ A: '', B: '', C: 'x' });
    expect(result.emptyValues).toBe(2);
  });

  it('counts unique values', () => {
    const result = summarizeEntries({ A: 'same', B: 'same', C: 'other' });
    expect(result.uniqueValues).toBe(2);
  });

  it('identifies longest and shortest keys', () => {
    const result = summarizeEntries({ AB: 'v1', ABCDE: 'v2', A: 'v3' });
    expect(result.longestKey).toBe('ABCDE');
    expect(result.shortestKey).toBe('A');
  });

  it('calculates average value length', () => {
    const result = summarizeEntries({ A: 'ab', B: 'abcd' });
    expect(result.averageValueLength).toBe(3);
  });
});

describe('formatSummary', () => {
  it('returns empty message for empty vault', () => {
    const result = formatSummary({ totalKeys: 0, emptyValues: 0, uniqueValues: 0, averageValueLength: 0, longestKey: '', shortestKey: '' });
    expect(result).toBe('Vault is empty.');
  });

  it('includes all fields in output', () => {
    const result = formatSummary({ totalKeys: 5, emptyValues: 1, uniqueValues: 4, averageValueLength: 8, longestKey: 'DATABASE_URL', shortestKey: 'ID' });
    expect(result).toContain('Total keys');
    expect(result).toContain('DATABASE_URL');
    expect(result).toContain('ID');
  });
});

describe('summarize command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints summary for a vault', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { KEY: 'value', OTHER: '' } } as any);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'summarize', 'my.vault', '--password', 'secret']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Total keys'));
  });

  it('exits on vault error', async () => {
    vi.spyOn(vault, 'openVault').mockRejectedValue(new Error('bad password'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'summarize', 'my.vault', '--password', 'wrong'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
