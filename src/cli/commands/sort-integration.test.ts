import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerSortCommand } from './sort';
import { registerInitCommand } from './init';
import { registerSetCommand } from './set';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerSetCommand(program);
  registerSortCommand(program);
  return program;
}

describe('sort integration', () => {
  it('sorts vault entries on disk', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sort-'));
    const vaultPath = path.join(dir, 'test.enc');
    const program = buildProgram();

    await program.parseAsync(['init', vaultPath, '-p', 'secret'], { from: 'user' });
    await program.parseAsync(['set', vaultPath, 'ZEBRA', 'z', '-p', 'secret'], { from: 'user' });
    await program.parseAsync(['set', vaultPath, 'APPLE', 'a', '-p', 'secret'], { from: 'user' });
    await program.parseAsync(['set', vaultPath, 'MANGO', 'm', '-p', 'secret'], { from: 'user' });
    await program.parseAsync(['sort', vaultPath, '-p', 'secret'], { from: 'user' });

    const { openVault } = await import('../../crypto/vault');
    const v = await openVault(vaultPath, 'secret');
    expect(Object.keys(v.entries)).toEqual(['APPLE', 'MANGO', 'ZEBRA']);

    fs.rmSync(dir, { recursive: true });
  });
});
