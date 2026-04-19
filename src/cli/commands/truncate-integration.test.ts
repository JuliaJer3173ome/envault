import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerTruncateCommand } from './truncate';
import { createVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTruncateCommand(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;
const PASSWORD = 'integration-pass';

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-truncate-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  await createVault(vaultPath, PASSWORD, { KEY1: 'val1', KEY2: 'val2', KEY3: 'val3' });
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('truncate integration', () => {
  it('removes specified keys from vault on disk', async () => {
    const { openVault } = await import('../../crypto/vault');
    const program = buildProgram();
    await program.parseAsync(
      ['truncate', vaultPath, 'KEY1', 'KEY3', '--password', PASSWORD, '--yes'],
      { from: 'user' }
    );
    const vault = await openVault(vaultPath, PASSWORD);
    expect(vault.entries).toEqual({ KEY2: 'val2' });
  });

  it('leaves vault intact when all keys are missing', async () => {
    const { openVault } = await import('../../crypto/vault');
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(
      ['truncate', vaultPath, 'NONEXISTENT', '--password', PASSWORD, '--yes'],
      { from: 'user' }
    );
    const vault = await openVault(vaultPath, PASSWORD);
    expect(Object.keys(vault.entries)).toHaveLength(3);
    logSpy.mockRestore();
  });
});
