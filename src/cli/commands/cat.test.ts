import { Command } from 'commander';
import { catEntries, registerCatCommand } from './cat';
import * as crypto from '../../crypto';
import { jest } from '@jest/globals';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCatCommand(program);
  return program;
}

describe('catEntries', () => {
  const entries = { FOO: 'bar', BAZ: 'qux', HELLO: 'world' };

  it('returns all entries when no keys specified', () => {
    const result = catEntries(entries, []);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
    expect(result).toContain('HELLO=world');
  });

  it('returns only specified keys', () => {
    const result = catEntries(entries, ['FOO', 'HELLO']);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('HELLO=world');
    expect(result).not.toContain('BAZ=qux');
  });

  it('skips keys not present in entries', () => {
    const result = catEntries(entries, ['FOO', 'MISSING']);
    expect(result).toBe('FOO=bar');
  });

  it('returns empty string for empty entries', () => {
    expect(catEntries({}, [])).toBe('');
  });
});

describe('cat command', () => {
  it('prints entries from vault', async () => {
    jest.spyOn(crypto, 'openVault').mockResolvedValue({
      entries: { API_KEY: 'secret', DB_URL: 'postgres://localhost' },
    } as any);
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const fsMock = await import('fs');
    jest.spyOn(fsMock, 'existsSync').mockReturnValue(true);

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'cat', 'vault.env', '-p', 'pass']);

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API_KEY=secret'));
    spy.mockRestore();
  });

  it('errors when vault not found', async () => {
    const fsMock = await import('fs');
    jest.spyOn(fsMock, 'existsSync').mockReturnValue(false);
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'cat', 'missing.env', '-p', 'pass'])
    ).rejects.toThrow();

    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('Vault not found'));
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
