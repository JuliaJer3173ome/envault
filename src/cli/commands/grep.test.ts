import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerGrepCommand, grepEntries } from './grep';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerGrepCommand(program);
  return program;
}

describe('grepEntries', () => {
  it('matches keys by pattern', () => {
    const entries = { DB_HOST: 'localhost', DB_PORT: '5432', API_KEY: 'secret' };
    const results = grepEntries(entries, 'DB_', false);
    expect(results).toHaveLength(2);
    expect(results.map(r => r.key)).toContain('DB_HOST');
    expect(results.map(r => r.key)).toContain('DB_PORT');
  });

  it('matches values when searchValues is true', () => {
    const entries = { HOST: 'localhost', PORT: '5432' };
    const results = grepEntries(entries, 'local', true);
    expect(results).toHaveLength(1);
    expect(results[0].key).toBe('HOST');
  });

  it('does not match values when searchValues is false', () => {
    const entries = { HOST: 'localhost' };
    const results = grepEntries(entries, 'local', false);
    expect(results).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const entries = { db_host: 'localhost' };
    const results = grepEntries(entries, 'DB_HOST', false);
    expect(results).toHaveLength(1);
  });
});

describe('grep command', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('prints matching entries', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(vault, 'openVault').mockResolvedValue({ DB_HOST: 'localhost', API_KEY: 'abc' });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['grep', 'DB_', 'vault.env', '--password', 'pass'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('DB_HOST=localhost');
  });

  it('prints no matches message when nothing found', async () => {
    vi.spyOn(fs, 'existsSync').mockReturnValue(true);
    vi.spyOn(vault, 'openVault').mockResolvedValue({ API_KEY: 'abc' });
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['grep', 'DB_', 'vault.env', '--password', 'pass'], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith('No matches found.');
  });
});
