import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerGrepCommand } from './grep';
import { createVault } from '../../crypto/vault';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerGrepCommand(program);
  return program;
}

describe('grep integration', () => {
  const tmpDir = os.tmpdir();
  const vaultPath = path.join(tmpDir, 'grep-test.vault');
  const password = 'integration-pass';

  afterEach(() => {
    if (fs.existsSync(vaultPath)) fs.unlinkSync(vaultPath);
  });

  it('finds matching keys in a real vault', async () => {
    await createVault(vaultPath, password, {
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      API_SECRET: 'topsecret',
    });
    const logs: string[] = [];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    const program = buildProgram();
    await program.parseAsync(['grep', 'DB_', vaultPath, '--password', password], { from: 'user' });
    expect(logs).toContain('DB_HOST=localhost');
    expect(logs).toContain('DB_PORT=5432');
    expect(logs).not.toContain('API_SECRET=topsecret');
    consoleSpy.mockRestore();
  });

  it('--keys-only prints only keys', async () => {
    await createVault(vaultPath, password, { MY_KEY: 'myvalue' });
    const logs: string[] = [];
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    const program = buildProgram();
    await program.parseAsync(['grep', 'MY_', vaultPath, '--password', password, '--keys-only'], { from: 'user' });
    expect(logs).toContain('MY_KEY');
    expect(logs).not.toContain('MY_KEY=myvalue');
    consoleSpy.mockRestore();
  });
});
