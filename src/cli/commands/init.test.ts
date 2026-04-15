import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerInitCommand } from './init';
import { readVault, openVault } from '../../crypto/vault';

describe('init command', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-test-'));
    vaultPath = path.join(tmpDir, '.envault');
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  function buildProgram(): Command {
    const program = new Command();
    program.exitOverride();
    registerInitCommand(program);
    return program;
  }

  it('creates a vault file at the specified path', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'init', '-f', vaultPath, '-p', 'supersecret123']);
    expect(fs.existsSync(vaultPath)).toBe(true);
  });

  it('created vault can be opened with the correct password', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'envault', 'init', '-f', vaultPath, '-p', 'supersecret123']);

    const vault = await readVault(vaultPath);
    const entries = await openVault(vault, 'supersecret123');
    expect(entries).toEqual({});
  });

  it('fails if vault already exists', async () => {
    fs.writeFileSync(vaultPath, '{}');
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'envault', 'init', '-f', vaultPath, '-p', 'supersecret123'])
    ).rejects.toThrow();

    mockExit.mockRestore();
  });

  it('fails if password is too short', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    await expect(
      program.parseAsync(['node', 'envault', 'init', '-f', vaultPath, '-p', 'short'])
    ).rejects.toThrow();

    mockExit.mockRestore();
  });
});
