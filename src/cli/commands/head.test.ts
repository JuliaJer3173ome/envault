import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerHeadCommand, headEntries } from './head';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerHeadCommand(program);
  return program;
}

describe('headEntries', () => {
  it('returns first N entries', () => {
    const entries = { A: '1', B: '2', C: '3', D: '4' };
    expect(headEntries(entries, 2)).toEqual({ A: '1', B: '2' });
  });

  it('returns all entries if N exceeds length', () => {
    const entries = { A: '1', B: '2' };
    expect(headEntries(entries, 10)).toEqual({ A: '1', B: '2' });
  });

  it('returns empty object for empty entries', () => {
    expect(headEntries({}, 5)).toEqual({});
  });
});

describe('head command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints first N key=value pairs', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { FOO: 'bar', BAZ: 'qux', HELLO: 'world' },
    } as any);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'head', 'vault.env', '-p', 'secret', '-n', '2']);
    expect(log).toHaveBeenCalledWith('FOO=bar');
    expect(log).toHaveBeenCalledWith('BAZ=qux');
    expect(log).not.toHaveBeenCalledWith('HELLO=world');
  });

  it('prints only keys with --keys-only', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({
      entries: { FOO: 'bar', BAZ: 'qux' },
    } as any);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'head', 'vault.env', '-p', 'secret', '--keys-only']);
    expect(log).toHaveBeenCalledWith('FOO');
    expect(log).toHaveBeenCalledWith('BAZ');
  });

  it('shows error on invalid count', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { A: '1' } } as any);
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'head', 'vault.env', '-p', 'secret', '-n', 'abc']);
    expect(err).toHaveBeenCalledWith('Error: count must be a positive integer');
    expect(exit).toHaveBeenCalledWith(1);
  });
});
