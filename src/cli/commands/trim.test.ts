import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { trimEntries, registerTrimCommand } from './trim';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTrimCommand(program);
  return program;
}

describe('trimEntries', () => {
  it('trims leading and trailing whitespace from values', () => {
    const entries = { KEY1: '  hello  ', KEY2: 'world', KEY3: '\ttest\n' };
    const { trimmed, count } = trimEntries(entries);
    expect(trimmed.KEY1).toBe('hello');
    expect(trimmed.KEY2).toBe('world');
    expect(trimmed.KEY3).toBe('test');
    expect(count).toBe(2);
  });

  it('returns count 0 when nothing to trim', () => {
    const entries = { A: 'clean', B: 'values' };
    const { count } = trimEntries(entries);
    expect(count).toBe(0);
  });

  it('handles empty entries', () => {
    const { trimmed, count } = trimEntries({});
    expect(trimmed).toEqual({});
    expect(count).toBe(0);
  });
});

describe('trim command', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('writes trimmed vault and logs count', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { KEY: '  val  ' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'trim', 'vault.env', '-p', 'pass']);
    expect(writeSpy).toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith('Trimmed 1 value(s).');
  });

  it('logs message when nothing to trim', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { KEY: 'clean' } } as any);
    vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'trim', 'vault.env', '-p', 'pass']);
    expect(log).toHaveBeenCalledWith('No values needed trimming.');
  });

  it('dry run does not write vault', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { KEY: ' val ' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    vi.spyOn(console, 'log').mockImplementation(() => {});
    await buildProgram().parseAsync(['node', 'test', 'trim', 'vault.env', '-p', 'pass', '--dry-run']);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});
