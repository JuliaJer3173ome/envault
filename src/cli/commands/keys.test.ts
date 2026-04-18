import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createVault } from '../../crypto';
import { registerKeysCommand, listKeys, filterKeys } from './keys';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerKeysCommand(program);
  return program;
}

describe('listKeys', () => {
  it('returns sorted keys', () => {
    expect(listKeys({ B: '2', A: '1', C: '3' })).toEqual(['A', 'B', 'C']);
  });

  it('returns empty array for empty entries', () => {
    expect(listKeys({})).toEqual([]);
  });
});

describe('filterKeys', () => {
  it('filters keys by pattern', () => {
    const keys = ['DB_HOST', 'DB_PORT', 'API_KEY'];
    expect(filterKeys(keys, 'DB')).toEqual(['DB_HOST', 'DB_PORT']);
  });

  it('is case-insensitive', () => {
    const keys = ['db_host', 'API_KEY'];
    expect(filterKeys(keys, 'api')).toEqual(['API_KEY']);
  });

  it('returns all keys when pattern matches all', () => {
    const keys = ['A', 'B'];
    expect(filterKeys(keys, '.*')).toEqual(['A', 'B']);
  });
});

describe('keys command', () => {
  let tmpDir: string;
  let vaultPath: string;
  const password = 'test-pass';

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-keys-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    await createVault(vaultPath, password, { DB_HOST: 'localhost', API_KEY: 'secret', DB_PORT: '5432' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  it('lists all keys', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['keys', vaultPath, '--password', password], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('API_KEY');
    expect(spy).toHaveBeenCalledWith('DB_HOST');
    spy.mockRestore();
  });

  it('filters keys by pattern', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['keys', vaultPath, '--password', password, '--filter', 'DB'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith('DB_HOST');
    expect(spy).toHaveBeenCalledWith('DB_PORT');
    expect(spy).not.toHaveBeenCalledWith('API_KEY');
    spy.mockRestore();
  });

  it('shows count only', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['keys', vaultPath, '--password', password, '--count'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(3);
    spy.mockRestore();
  });
});
