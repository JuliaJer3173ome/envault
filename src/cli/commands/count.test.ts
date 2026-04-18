import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerCountCommand, countEntries } from './count';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCountCommand(program);
  return program;
}

vi.mock('../../crypto/vault');
vi.mock('./count', async (importOriginal) => {
  const mod = await importOriginal<typeof import('./count')>();
  return { ...mod, promptPassword: vi.fn().mockResolvedValue('secret') };
});

describe('countEntries', () => {
  it('counts all entries when no tag given', () => {
    const entries = { FOO: '1', BAR: '2', BAZ: '3' };
    expect(countEntries(entries)).toBe(3);
  });

  it('returns 0 for empty entries', () => {
    expect(countEntries({})).toBe(0);
  });

  it('filters by tag prefix', () => {
    const entries = { 'db:HOST': 'localhost', 'db:PORT': '5432', 'APP_KEY': 'xyz' };
    expect(countEntries(entries, 'db')).toBe(2);
  });
});

describe('count command', () => {
  beforeEach(() => {
    vi.mocked(vault.openVault).mockResolvedValue({
      entries: { KEY1: 'val1', KEY2: 'val2' },
      salt: 'salt',
      iv: 'iv',
    } as any);
  });

  it('prints total entry count', async () => {
    const program = buildProgram();
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'test', 'count', 'vault.enc', '--password', 'secret']);
    expect(spy).toHaveBeenCalledWith('Total entries: 2');
    spy.mockRestore();
  });

  it('prints filtered count with tag', async () => {
    vi.mocked(vault.openVault).mockResolvedValue({
      entries: { 'db:HOST': 'localhost', 'db:PORT': '5432', APP_KEY: 'xyz' },
      salt: 'salt',
      iv: 'iv',
    } as any);
    const program = buildProgram();
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'test', 'count', 'vault.enc', '--password', 'secret', '--tag', 'db']);
    expect(spy).toHaveBeenCalledWith('Entries matching tag "db": 2');
    spy.mockRestore();
  });
});
