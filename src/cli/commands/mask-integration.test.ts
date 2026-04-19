import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerMaskCommand } from './mask';
import { createVault, writeVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerMaskCommand(program);
  return program;
}

describe('mask integration', () => {
  it('masks and writes values to a real vault', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-mask-'));
    const vaultPath = path.join(dir, 'test.vault');
    const password = 'testpass';

    const vault = await createVault(password);
    vault.entries = { SECRET_KEY: 'supersecretvalue', SAFE: 'visible' };
    await writeVault(vaultPath, vault);

    const logs: string[] = [];
    const origLog = console.log;
    console.log = (msg: string) => logs.push(msg);

    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'mask', vaultPath, 'SECRET_KEY', '--password', password
    ]);

    console.log = origLog;

    const secretLine = logs.find(l => l.startsWith('SECRET_KEY='));
    expect(secretLine).toBeDefined();
    expect(secretLine).toMatch(/\*/);
    expect(secretLine).not.toContain('supersecretvalue');

    const safeLine = logs.find(l => l.startsWith('SAFE='));
    expect(safeLine).toBe('SAFE=visible');

    fs.rmSync(dir, { recursive: true });
  });
});
