import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { reverseEntries, registerReverseCommand } from './reverse';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerReverseCommand(program);
  return program;
}

describe('reverseEntries', () => {
  it('reverses the order of keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    const result = reverseEntries(entries);
    expect(Object.keys(result)).toEqual(['C', 'B', 'A']);
  });

  it('returns empty object for empty input', () => {
    expect(reverseEntries({})).toEqual({});
  });

  it('preserves values', () => {
    const entries = { X: 'hello', Y: 'world' };
    const result = reverseEntries(entries);
    expect(result['X']).toBe('hello');
    expect(result['Y']).toBe('world');
  });
});

describe('reverse command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('writes reversed vault', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { B: '2', A: '1' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'reverse', 'my.vault', '-p', 'secret']);

    expect(writeSpy).toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('Reversed'));
  });

  it('prints entries in dry-run mode without saving', async () => {
    vi.spyOn(vault, 'openVault').mockResolvedValue({ entries: { B: '2', A: '1' } } as any);
    const writeSpy = vi.spyOn(vault, 'writeVault').mockResolvedValue(undefined);
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'reverse', 'my.vault', '-p', 'secret', '--dry-run']);

    expect(writeSpy).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalled();
  });
});
