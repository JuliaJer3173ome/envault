import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { createVault, openVault } from '../../crypto/vault';
import { registerExpireCommand, readExpiry } from './expire';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerExpireCommand(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;
const password = 'int-pass';

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expire-int-'));
  vaultPath = path.join(tmpDir, 'vault.vault');
  await createVault(vaultPath, { A: '1', B: '2', C: '3' }, password);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('expire integration', () => {
  it('purges expired keys from vault and expiry file', async () => {
    const program = buildProgram();
    await program.parseAsync(['expire', vaultPath, 'A', '2000-01-01T00:00:00Z', '-p', password], { from: 'user' });
    await program.parseAsync(['expire', vaultPath, 'B', '2099-01-01T00:00:00Z', '-p', password], { from: 'user' });

    const program2 = buildProgram();
    await program2.parseAsync(['expire-check', vaultPath, '--purge', '-p', password], { from: 'user' });

    const entries = await openVault(vaultPath, password);
    expect(entries['A']).toBeUndefined();
    expect(entries['B']).toBe('2');
    expect(entries['C']).toBe('3');

    const expiry = readExpiry(vaultPath);
    expect(expiry['A']).toBeUndefined();
    expect(expiry['B']).toBeDefined();
  });

  it('does nothing when no keys expired', async () => {
    const program = buildProgram();
    await program.parseAsync(['expire', vaultPath, 'A', '2099-01-01T00:00:00Z', '-p', password], { from: 'user' });

    const program2 = buildProgram();
    await program2.parseAsync(['expire-check', vaultPath, '--purge', '-p', password], { from: 'user' });

    const entries = await openVault(vaultPath, password);
    expect(entries['A']).toBe('1');
  });
});
