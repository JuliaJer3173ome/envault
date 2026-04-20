import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { lowercaseEntries, registerLowercaseCommand } from './lowercase';
import * as vault from '../../crypto/vault';

vi.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLowercaseCommand(program);
  return program;
}

describe('lowercaseEntries', () => {
  it('lowercases all values when no keys specified', () => {
    const entries = { FOO: 'Hello', BAR: 'WORLD' };
    expect(lowercaseEntries(entries)).toEqual({ FOO: 'hello', BAR: 'world' });
  });

  it('lowercases only specified keys', () => {
    const entries = { FOO: 'HELLO', BAR: 'WORLD' };
    expect(lowercaseEntries(entries, ['FOO'])).toEqual({
      FOO: 'hello',
      BAR: 'WORLD',
    });
  });

  it('leaves already-lowercase values unchanged', () => {
    const entries = { FOO: 'hello', BAR: 'world' };
    expect(lowercaseEntries(entries)).toEqual({ FOO: 'hello', BAR: 'world' });
  });

  it('handles empty entries', () => {
    expect(lowercaseEntries({})).toEqual({});
  });

  it('handles mixed-case values', () => {
    const entries = { KEY: 'HeLLo WoRLd' };
    expect(lowercaseEntries(entries)).toEqual({ KEY: 'hello world' });
  });
});

describe('lowercase command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lowercases all entries and writes vault', async () => {
    const mockVault = { entries: { A: 'HELLO', B: 'WORLD' } };
    vi.mocked(vault.openVault).mockResolvedValue(mockVault as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lowercase', 'my.vault', '-p', 'secret']);

    expect(vault.openVault).toHaveBeenCalledWith('my.vault', 'secret');
    expect(mockVault.entries).toEqual({ A: 'hello', B: 'world' });
    expect(vault.writeVault).toHaveBeenCalledWith('my.vault', mockVault);
    expect(spy).toHaveBeenCalledWith('Lowercased 2 entries.');
    spy.mockRestore();
  });

  it('lowercases only specified keys', async () => {
    const mockVault = { entries: { A: 'HELLO', B: 'WORLD' } };
    vi.mocked(vault.openVault).mockResolvedValue(mockVault as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);

    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lowercase', 'my.vault', '-p', 'secret', '-k', 'A']);

    expect(mockVault.entries).toEqual({ A: 'hello', B: 'WORLD' });
    expect(spy).toHaveBeenCalledWith('Lowercased 1 entry.');
    spy.mockRestore();
  });

  it('prints error and exits on failure', async () => {
    vi.mocked(vault.openVault).mockRejectedValue(new Error('bad password'));
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'lowercase', 'my.vault', '-p', 'wrong'])
    ).rejects.toThrow('exit');
    expect(errSpy).toHaveBeenCalledWith('Error: bad password');
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
