import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { registerVerifyCommand, verifyVault } from './verify';
import { createVault } from '../../crypto';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerVerifyCommand(program);
  return program;
}

describe('verifyVault', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-verify-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    await createVault(vaultPath, 'correct-password', { KEY1: 'val1', KEY2: 'val2' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns valid=true with correct password', async () => {
    const result = await verifyVault(vaultPath, 'correct-password');
    expect(result.valid).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(result.error).toBeUndefined();
  });

  it('returns valid=false with wrong password', async () => {
    const result = await verifyVault(vaultPath, 'wrong-password');
    expect(result.valid).toBe(false);
    expect(result.keyCount).toBe(0);
    expect(result.error).toBeDefined();
  });

  it('returns valid=false when vault does not exist', async () => {
    const result = await verifyVault('/nonexistent/path.vault', 'any');
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not found/);
  });
});

describe('verify command', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-verify-cmd-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    await createVault(vaultPath, 'secret', { A: '1' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exits with code 0 for valid vault', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit:0'); });
    await expect(
      program.parseAsync(['verify', vaultPath, '--password', 'secret', '--quiet'], { from: 'user' })
    ).rejects.toThrow('exit:0');
    expect(mockExit).toHaveBeenCalledWith(0);
    mockExit.mockRestore();
  });

  it('exits with code 1 for invalid password', async () => {
    const program = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit:1'); });
    await expect(
      program.parseAsync(['verify', vaultPath, '--password', 'wrong', '--quiet'], { from: 'user' })
    ).rejects.toThrow('exit:1');
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
