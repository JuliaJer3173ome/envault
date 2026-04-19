import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { redactEntries, registerRedactCommand } from './redact';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRedactCommand(program);
  return program;
}

describe('redactEntries', () => {
  it('replaces specified keys with redacted placeholder', () => {
    const entries = { FOO: 'secret', BAR: 'value', BAZ: 'other' };
    const result = redactEntries(entries, ['FOO', 'BAR']);
    expect(result.FOO).toBe('***REDACTED***');
    expect(result.BAR).toBe('***REDACTED***');
    expect(result.BAZ).toBe('other');
  });

  it('ignores keys not present in entries', () => {
    const entries = { FOO: 'secret' };
    const result = redactEntries(entries, ['MISSING']);
    expect(result).toEqual({ FOO: 'secret' });
  });

  it('does not mutate original entries', () => {
    const entries = { FOO: 'secret' };
    redactEntries(entries, ['FOO']);
    expect(entries.FOO).toBe('secret');
  });
});

describe('redact command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('redacts keys and writes vault', async () => {
    const fakeVault = { entries: { API_KEY: 'abc123', DB_PASS: 'hunter2' } };
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined as any);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'redact', 'my.vault', 'API_KEY', '--password', 'pass']);

    expect(writeSpy).toHaveBeenCalledOnce();
    const written = writeSpy.mock.calls[0][2] as any;
    expect(written.entries.API_KEY).toBe('***REDACTED***');
    expect(written.entries.DB_PASS).toBe('hunter2');
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('redacted'));
  });

  it('permanently removes keys when --permanent flag is set', async () => {
    const fakeVault = { entries: { API_KEY: 'abc123', DB_PASS: 'hunter2' } };
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined as any);
    vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'redact', 'my.vault', 'API_KEY', '--password', 'pass', '--permanent']);

    const written = writeSpy.mock.calls[0][2] as any;
    expect(written.entries.API_KEY).toBeUndefined();
    expect(written.entries.DB_PASS).toBe('hunter2');
  });
});
