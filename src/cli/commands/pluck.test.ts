import { Command } from 'commander';
import { pluckEntries, registerPluckCommand } from './pluck';
import { createVault, writeVault, openVault } from '../../crypto/vault';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPluckCommand(program);
  return program;
}

describe('pluckEntries', () => {
  it('returns only the requested keys', () => {
    const entries = { FOO: 'foo', BAR: 'bar', BAZ: 'baz' };
    expect(pluckEntries(entries, ['FOO', 'BAZ'])).toEqual({ FOO: 'foo', BAZ: 'baz' });
  });

  it('ignores keys that do not exist', () => {
    const entries = { FOO: 'foo' };
    expect(pluckEntries(entries, ['FOO', 'MISSING'])).toEqual({ FOO: 'foo' });
  });

  it('returns empty object when no keys match', () => {
    const entries = { FOO: 'foo' };
    expect(pluckEntries(entries, ['NOPE'])).toEqual({});
  });

  it('returns empty object for empty input', () => {
    expect(pluckEntries({}, ['FOO'])).toEqual({});
  });
});

describe('pluck command', () => {
  let tmpDir: string;
  let vaultPath: string;
  const password = 'test-password';

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pluck-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    const vault = createVault();
    vault.entries = { API_KEY: 'secret', DB_URL: 'postgres://localhost', PORT: '3000' };
    await writeVault(vaultPath, vault, password);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('plucks specified keys and prints them', async () => {
    const program = buildProgram();
    const output: string[] = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((msg: any) => { output.push(msg); return true; });
    await program.parseAsync(['node', 'test', 'pluck', vaultPath, 'API_KEY', 'PORT', '--password', password]);
    const combined = output.join('');
    expect(combined).toContain('API_KEY=secret');
    expect(combined).toContain('PORT=3000');
    expect(combined).not.toContain('DB_URL');
    jest.restoreAllMocks();
  });

  it('outputs JSON when --json flag is set', async () => {
    const program = buildProgram();
    const output: string[] = [];
    jest.spyOn(process.stdout, 'write').mockImplementation((msg: any) => { output.push(msg); return true; });
    await program.parseAsync(['node', 'test', 'pluck', vaultPath, 'DB_URL', '--password', password, '--json']);
    const parsed = JSON.parse(output.join(''));
    expect(parsed).toEqual({ DB_URL: 'postgres://localhost' });
    jest.restoreAllMocks();
  });
});
