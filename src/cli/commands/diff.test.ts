import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerDiffCommand, diffVaults } from './diff';
import { createVault } from '../../crypto';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerDiffCommand(program);
  return program;
}

describe('diffVaults', () => {
  it('detects added keys', () => {
    const result = diffVaults({ A: '1' }, { A: '1', B: '2' });
    expect(result.added).toEqual(['B']);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it('detects removed keys', () => {
    const result = diffVaults({ A: '1', B: '2' }, { A: '1' });
    expect(result.removed).toEqual(['B']);
    expect(result.added).toEqual([]);
    expect(result.changed).toEqual([]);
  });

  it('detects changed keys', () => {
    const result = diffVaults({ A: '1' }, { A: '2' });
    expect(result.changed).toEqual(['A']);
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
  });

  it('returns empty diff for identical vaults', () => {
    const result = diffVaults({ A: '1' }, { A: '1' });
    expect(result.added).toEqual([]);
    expect(result.removed).toEqual([]);
    expect(result.changed).toEqual([]);
  });
});

describe('diff command', () => {
  let tmpDir: string;
  let vaultA: string;
  let vaultB: string;
  const password = 'test-password';

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-diff-'));
    vaultA = path.join(tmpDir, 'a.vault');
    vaultB = path.join(tmpDir, 'b.vault');
    createVault(vaultA, password, { KEY1: 'value1' });
    createVault(vaultB, password, { KEY1: 'value1', KEY2: 'value2' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('shows diff between two vaults', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', vaultA, vaultB, '--password', password]);
    expect(consoleSpy).toHaveBeenCalledWith('+ KEY2');
    consoleSpy.mockRestore();
  });

  it('reports identical vaults', async () => {
    createVault(vaultB, password, { KEY1: 'value1' });
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'diff', vaultA, vaultB, '--password', password]);
    expect(consoleSpy).toHaveBeenCalledWith('Vaults are identical.');
    consoleSpy.mockRestore();
  });
});
