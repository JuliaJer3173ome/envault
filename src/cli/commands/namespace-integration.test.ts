import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerNamespaceCommand } from './namespace';
import { registerInitCommand } from './init';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerNamespaceCommand(program);
  return program;
}

describe('namespace integration', () => {
  it('adds and strips namespace round-trip', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-ns-'));
    const vaultPath = path.join(dir, 'test.vault');
    const program = buildProgram();

    await program.parseAsync(['init', vaultPath, '-p', 'pass123'], { from: 'user' });

    const { openVault, writeVault } = await import('../../crypto/vault');
    const v = await openVault(vaultPath, 'pass123');
    v.entries = { DB_HOST: 'localhost', DB_PORT: '5432' };
    await writeVault(vaultPath, v);

    await program.parseAsync(['namespace', 'add', vaultPath, 'PROD', '-p', 'pass123'], { from: 'user' });

    const after = await openVault(vaultPath, 'pass123');
    expect(after.entries).toHaveProperty('PROD_DB_HOST', 'localhost');
    expect(after.entries).toHaveProperty('PROD_DB_PORT', '5432');

    await program.parseAsync(['namespace', 'strip', vaultPath, 'PROD', '-p', 'pass123'], { from: 'user' });

    const restored = await openVault(vaultPath, 'pass123');
    expect(restored.entries).toEqual({ DB_HOST: 'localhost', DB_PORT: '5432' });

    fs.rmSync(dir, { recursive: true });
  });
});
