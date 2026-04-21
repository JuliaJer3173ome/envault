import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { omitEntries, registerOmitCommand } from './omit';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerOmitCommand(program);
  return program;
}

describe('omitEntries', () => {
  it('removes specified keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    expect(omitEntries(entries, ['B'])).toEqual({ A: '1', C: '3' });
  });

  it('returns all entries when keys list is empty', () => {
    const entries = { A: '1', B: '2' };
    expect(omitEntries(entries, [])).toEqual({ A: '1', B: '2' });
  });

  it('ignores keys not present in entries', () => {
    const entries = { A: '1' };
    expect(omitEntries(entries, ['Z'])).toEqual({ A: '1' });
  });

  it('removes multiple keys', () => {
    const entries = { A: '1', B: '2', C: '3', D: '4' };
    expect(omitEntries(entries, ['A', 'C'])).toEqual({ B: '2', D: '4' });
  });
});

describe('omit command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes updated vault after omitting keys', async () => {
    const fakeVault = { entries: { A: '1', B: '2', C: '3' } };
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['omit', 'my.vault', 'B', 'C', '--password', 'secret'], { from: 'user' });

    expect(fakeVault.entries).toEqual({ A: '1' });
    expect(writeSpy).toHaveBeenCalledWith('my.vault', fakeVault, 'secret');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Removed 2 key(s)'));
  });

  it('prints result without saving on --dry-run', async () => {
    const fakeVault = { entries: { X: 'a', Y: 'b' } };
    vi.spyOn(vault, 'openVault').mockResolvedValue(fakeVault as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['omit', 'my.vault', 'X', '--password', 'secret', '--dry-run'], { from: 'user' });

    expect(writeSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Dry run'));
  });

  it('exits with error when no password provided', async () => {
    delete process.env.ENVAULT_PASSWORD;
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => { throw new Error('exit'); }) as any);
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const program = buildProgram();
    await expect(
      program.parseAsync(['omit', 'my.vault', 'A'], { from: 'user' })
    ).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });
});
