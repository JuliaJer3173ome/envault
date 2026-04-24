import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerGroupCommand, groupEntries } from './group';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerGroupCommand(program);
  return program;
}

vi.mock('../../crypto/vault');

const mockEntries = {
  DB_HOST: 'localhost',
  DB_PORT: '5432',
  APP_NAME: 'envault',
  APP_ENV: 'production',
  SECRET: 'abc123',
};

describe('groupEntries', () => {
  it('groups entries by key prefix', () => {
    const groups = groupEntries(mockEntries, '');
    expect(groups['DB']).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });
    expect(groups['APP']).toEqual({ APP_NAME: 'envault', APP_ENV: 'production' });
  });

  it('places keys without underscore into default group', () => {
    const groups = groupEntries({ SIMPLE: 'value' }, '__default__');
    expect(groups['SIMPLE']).toEqual({ SIMPLE: 'value' });
  });

  it('returns empty object for empty entries', () => {
    const groups = groupEntries({}, '');
    expect(Object.keys(groups)).toHaveLength(0);
  });
});

describe('group command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vault.openVault).mockResolvedValue({
      entries: mockEntries,
      salt: 'salt',
      iv: 'iv',
    } as any);
  });

  it('prints grouped entries to stdout', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'group', 'test.vault', '-p', 'secret']);
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[DB]'));
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('[APP]'));
    consoleSpy.mockRestore();
  });

  it('outputs JSON when --json flag is set', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'group', 'test.vault', '-p', 'secret', '--json']);
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('DB');
    expect(parsed.DB).toHaveProperty('DB_HOST', 'localhost');
    consoleSpy.mockRestore();
  });

  it('filters by prefix when --prefix is provided', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'group', 'test.vault', '-p', 'secret', '--prefix', 'DB', '--json']);
    const output = consoleSpy.mock.calls[0][0];
    const parsed = JSON.parse(output);
    expect(parsed).toHaveProperty('DB');
    expect(parsed).not.toHaveProperty('APP');
    consoleSpy.mockRestore();
  });

  it('exits with error if vault cannot be opened', async () => {
    vi.mocked(vault.openVault).mockRejectedValue(new Error('bad password'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'envault', 'group', 'test.vault', '-p', 'wrong']))
      .rejects.toThrow('exit');
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('bad password'));
    consoleSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
