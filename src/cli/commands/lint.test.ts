import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { lintEntries, registerLintCommand } from './lint';
import * as crypto from '../../crypto';
import * as fs from 'fs';

vi.mock('fs');
vi.mock('../../crypto');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerLintCommand(program);
  return program;
}

describe('lintEntries', () => {
  it('returns no issues for valid entries', () => {
    expect(lintEntries({ DATABASE_URL: 'postgres://localhost/db' })).toHaveLength(0);
  });

  it('warns on lowercase key', () => {
    const issues = lintEntries({ my_key: 'value' });
    expect(issues.some(i => i.message.includes('uppercase'))).toBe(true);
  });

  it('warns on empty value', () => {
    const issues = lintEntries({ MY_KEY: '' });
    expect(issues.some(i => i.message.includes('empty'))).toBe(true);
  });

  it('errors on key with whitespace', () => {
    const issues = lintEntries({ 'MY KEY': 'val' });
    expect(issues.some(i => i.severity === 'error' && i.message.includes('whitespace'))).toBe(true);
  });

  it('warns on value exceeding 1024 chars', () => {
    const issues = lintEntries({ BIG_VAL: 'x'.repeat(1025) });
    expect(issues.some(i => i.message.includes('1024'))).toBe(true);
  });
});

describe('lint command', () => {
  beforeEach(() => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(crypto.openVault).mockResolvedValue({ entries: { GOOD_KEY: 'value' } } as any);
  });

  it('prints no issues for clean vault', async () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'lint', 'vault.env', '--password', 'secret']);
    expect(spy).toHaveBeenCalledWith('No issues found.');
    spy.mockRestore();
  });

  it('exits with 1 if vault not found', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'lint', 'missing.env', '--password', 'secret'])).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
