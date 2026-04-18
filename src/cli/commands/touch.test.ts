import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerTouchCommand } from './touch';
import * as vaultModule from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTouchCommand(program);
  return program;
}

describe('touch command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-touch-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a new vault when it does not exist', async () => {
    const vaultPath = path.join(tmpDir, 'new.vault');
    const createVaultSpy = jest
      .spyOn(vaultModule, 'createVault')
      .mockResolvedValue(undefined as any);

    const program = buildProgram();
    await program.parseAsync(['touch', vaultPath, '--password', 'secret'], { from: 'user' });

    expect(createVaultSpy).toHaveBeenCalledWith(vaultPath, 'secret');
    createVaultSpy.mockRestore();
  });

  it('skips creation when vault already exists', async () => {
    const vaultPath = path.join(tmpDir, 'existing.vault');
    fs.writeFileSync(vaultPath, '{}');

    const createVaultSpy = jest.spyOn(vaultModule, 'createVault');
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['touch', vaultPath, '--password', 'secret'], { from: 'user' });

    expect(createVaultSpy).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('already exists'));

    createVaultSpy.mockRestore();
    consoleSpy.mockRestore();
  });

  it('prints error and exits on failure', async () => {
    const vaultPath = path.join(tmpDir, 'fail.vault');
    jest.spyOn(vaultModule, 'createVault').mockRejectedValue(new Error('disk full'));
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['touch', vaultPath, '--password', 'secret'], { from: 'user' })
    ).rejects.toThrow('exit');

    expect(errorSpy).toHaveBeenCalledWith('Failed to create vault:', 'disk full');
    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
