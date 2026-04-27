import fs from 'fs';
import path from 'path';
import os from 'os';
import { Command } from 'commander';
import {
  getRollbackDir,
  listRollbacks,
  saveRollback,
  registerRollbackCommand,
} from './rollback';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerRollbackCommand(program);
  return program;
}

describe('getRollbackDir', () => {
  it('returns a hidden sibling directory based on vault name', () => {
    const result = getRollbackDir('/home/user/my.vault');
    expect(result).toBe('/home/user/.my.rollback');
  });
});

describe('listRollbacks', () => {
  it('returns empty array when rollback dir does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-'));
    const vault = path.join(tmp, 'test.vault');
    expect(listRollbacks(vault)).toEqual([]);
  });

  it('returns rollback files sorted newest first', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-'));
    const vault = path.join(tmp, 'test.vault');
    const dir = getRollbackDir(vault);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, '2024-01-01T00-00-00-000Z.vault'), 'a');
    fs.writeFileSync(path.join(dir, '2024-06-01T00-00-00-000Z.vault'), 'b');
    const result = listRollbacks(vault);
    expect(result[0]).toContain('2024-06-01');
    expect(result[1]).toContain('2024-01-01');
  });
});

describe('saveRollback', () => {
  it('creates rollback directory and saves a timestamped file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-'));
    const vault = path.join(tmp, 'my.vault');
    saveRollback(vault, Buffer.from('vault-data'));
    const files = listRollbacks(vault);
    expect(files).toHaveLength(1);
    const dir = getRollbackDir(vault);
    const content = fs.readFileSync(path.join(dir, files[0]));
    expect(content.toString()).toBe('vault-data');
  });
});

describe('rollback list command', () => {
  it('prints no rollback points message when none exist', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-'));
    const vault = path.join(tmp, 'test.vault');
    const program = buildProgram();
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync(['node', 'envault', 'rollback', 'list', vault]);
    expect(spy).toHaveBeenCalledWith('No rollback points found.');
    spy.mockRestore();
  });
});
