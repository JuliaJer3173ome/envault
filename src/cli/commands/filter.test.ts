import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { registerFilterCommand, filterEntries } from './filter';
import * as vaultModule from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerFilterCommand(program);
  return program;
}

describe('filterEntries', () => {
  it('filters entries by key pattern', () => {
    const entries = { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'myapp' };
    const result = filterEntries(entries, { keyPattern: 'DB_' });
    expect(result).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
  });

  it('filters entries by value pattern', () => {
    const entries = { HOST: 'localhost', PORT: '5432', ENV: 'production' };
    const result = filterEntries(entries, { valuePattern: 'local' });
    expect(result).toEqual({ HOST: 'localhost' });
  });

  it('filters entries by both key and value pattern', () => {
    const entries = { DB_HOST: 'localhost', DB_PORT: '5432', APP_HOST: 'remotehost' };
    const result = filterEntries(entries, { keyPattern: 'DB_', valuePattern: 'local' });
    expect(result).toEqual({ DB_HOST: 'localhost' });
  });

  it('returns all entries when no pattern provided', () => {
    const entries = { A: '1', B: '2' };
    const result = filterEntries(entries, {});
    expect(result).toEqual({ A: '1', B: '2' });
  });

  it('returns empty object when nothing matches', () => {
    const entries = { FOO: 'bar' };
    const result = filterEntries(entries, { keyPattern: 'NOPE' });
    expect(result).toEqual({});
  });

  it('supports regex-like patterns', () => {
    const entries = { API_KEY: 'secret', API_SECRET: 'topsecret', DB_PASS: 'pass' };
    const result = filterEntries(entries, { keyPattern: '^API_' });
    expect(result).toEqual({ API_KEY: 'secret', API_SECRET: 'topsecret' });
  });

  it('inverts filter when negate option is set', () => {
    const entries = { DB_HOST: 'localhost', APP_NAME: 'myapp' };
    const result = filterEntries(entries, { keyPattern: 'DB_', negate: true });
    expect(result).toEqual({ APP_NAME: 'myapp' });
  });
});

describe('filter command', () => {
  const mockVault = { entries: { DB_HOST: 'localhost', DB_PORT: '5432', APP_NAME: 'myapp' } };

  beforeEach(() => {
    vi.spyOn(vaultModule, 'openVault').mockResolvedValue(mockVault as any);
    vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters by key pattern and prints results', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'filter', 'vault.env', '--key', 'DB_', '--password', 'secret']);
    expect(vaultModule.openVault).toHaveBeenCalled();
  });

  it('filters by value pattern', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'filter', 'vault.env', '--value', 'local', '--password', 'secret']);
    expect(vaultModule.openVault).toHaveBeenCalled();
  });

  it('supports --negate flag', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'filter', 'vault.env', '--key', 'DB_', '--negate', '--password', 'secret']);
    expect(vaultModule.openVault).toHaveBeenCalled();
  });

  it('exits with error when vault open fails', async () => {
    vi.spyOn(vaultModule, 'openVault').mockRejectedValue(new Error('bad password'));
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'filter', 'vault.env', '--key', 'DB_', '--password', 'wrong'])
    ).rejects.toThrow();
    mockExit.mockRestore();
  });
});
