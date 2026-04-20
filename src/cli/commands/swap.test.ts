import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { swapEntries, registerSwapCommand } from './swap';
import * as vault from '../../crypto/vault';

vi.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerSwapCommand(program);
  return program;
}

describe('swapEntries', () => {
  it('swaps values of two keys', () => {
    const entries = { FOO: 'hello', BAR: 'world', BAZ: 'other' };
    const result = swapEntries(entries, 'FOO', 'BAR');
    expect(result.FOO).toBe('world');
    expect(result.BAR).toBe('hello');
    expect(result.BAZ).toBe('other');
  });

  it('throws if keyA not found', () => {
    expect(() => swapEntries({ FOO: 'a' }, 'MISSING', 'FOO')).toThrow('Key not found: MISSING');
  });

  it('throws if keyB not found', () => {
    expect(() => swapEntries({ FOO: 'a' }, 'FOO', 'MISSING')).toThrow('Key not found: MISSING');
  });

  it('does not mutate the original object', () => {
    const entries = { A: '1', B: '2' };
    swapEntries(entries, 'A', 'B');
    expect(entries.A).toBe('1');
  });
});

describe('swap command', () => {
  beforeEach(() => {
    vi.mocked(vault.openVault).mockResolvedValue({ KEY1: 'alpha', KEY2: 'beta' });
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);
  });

  it('swaps keys and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'swap', 'my.vault', 'KEY1', 'KEY2', '-p', 'secret']);
    expect(vault.writeVault).toHaveBeenCalledWith(
      'my.vault',
      { KEY1: 'beta', KEY2: 'alpha' },
      'secret'
    );
  });

  it('exits on error', async () => {
    vi.mocked(vault.openVault).mockRejectedValue(new Error('bad password'));
    const program = buildProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'swap', 'my.vault', 'KEY1', 'KEY2', '-p', 'wrong'])
    ).rejects.toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
