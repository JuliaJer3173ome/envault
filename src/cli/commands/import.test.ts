import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerImportCommand } from './import';
import { registerInitCommand } from './init';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerImportCommand(program);
  return program;
}

describe('import command', () => {
  let tmpDir: string;
  let vaultPath: string;
  let envFilePath: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-import-test-'));
    vaultPath = path.join(tmpDir, '.envault');
    envFilePath = path.join(tmpDir, '.env');

    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'init', '--vault', vaultPath, '--password', 'secret']);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports variables from a .env file', async () => {
    fs.writeFileSync(envFilePath, 'FOO=bar\nBAZ=qux\n');
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'import', envFilePath, '--vault', vaultPath, '--password', 'secret']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 variable(s)'));
    consoleSpy.mockRestore();
  });

  it('handles quoted values correctly', async () => {
    fs.writeFileSync(envFilePath, 'QUOTED="hello world"\nSINGLE=\'test value\'\n');
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'import', envFilePath, '--vault', vaultPath, '--password', 'secret']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('2 variable(s)'));
    consoleSpy.mockRestore();
  });

  it('skips comments and blank lines', async () => {
    fs.writeFileSync(envFilePath, '# This is a comment\n\nVALID=yes\n');
    const program = buildProgram();
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    await program.parseAsync(['node', 'envault', 'import', envFilePath, '--vault', vaultPath, '--password', 'secret']);

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('1 variable(s)'));
    consoleSpy.mockRestore();
  });

  it('exits with error if env file does not exist', async () => {
    const program = buildProgram();
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      program.parseAsync(['node', 'envault', 'import', '/nonexistent/.env', '--vault', vaultPath, '--password', 'secret'])
    ).rejects.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('File not found'));
    exitSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
