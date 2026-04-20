import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerDefaultCommand } from './default';
import { createVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerDefaultCommand(program);
  return program;
}

describe('default command (integration)', () => {
  let tmpDir: string;
  let vaultPath: string;
  const password = 'integration-pass';
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-default-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    await createVault(vaultPath, password, { NODE_ENV: 'staging', SECRET: 'xyz' });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    jest.clearAllMocks();
  });

  it('detects NODE_ENV as default key', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'default', vaultPath, '--password', password]);
    expect(consoleSpy).toHaveBeenCalledWith('Default key: NODE_ENV');
    expect(consoleSpy).toHaveBeenCalledWith('Value: staging');
  });

  it('shows specified key with --set', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'default', vaultPath, '--password', password, '--set', 'SECRET']);
    expect(consoleSpy).toHaveBeenCalledWith('Default key: SECRET');
    expect(consoleSpy).toHaveBeenCalledWith('Value: xyz');
  });
});
