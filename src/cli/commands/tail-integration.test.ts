import { describe, it, expect, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerTailCommand } from './tail';
import { registerInitCommand } from './init';
import { registerSetCommand } from './set';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerSetCommand(program);
  registerTailCommand(program);
  return program;
}

/**
 * Temporarily captures console.log output during the execution of a callback.
 * Restores the original console.log after the callback completes.
 */
async function captureConsoleLogs(fn: () => Promise<void>): Promise<string[]> {
  const logs: string[] = [];
  const orig = console.log;
  console.log = (msg: string) => logs.push(msg);
  try {
    await fn();
  } finally {
    console.log = orig;
  }
  return logs;
}

describe('tail integration', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('tails entries from a real vault', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tail-'));
    tempDirs.push(dir);
    const vaultPath = path.join(dir, 'test.ev');
    const program = buildProgram();

    await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', 'secret']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'FIRST', 'aaa', '-p', 'secret']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'SECOND', 'bbb', '-p', 'secret']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'THIRD', 'ccc', '-p', 'secret']);

    const logs = await captureConsoleLogs(() =>
      program.parseAsync(['node', 'test', 'tail', vaultPath, '-n', '2', '-p', 'secret'])
    );

    expect(logs).toContain('SECOND=bbb');
    expect(logs).toContain('THIRD=ccc');
    expect(logs).not.toContain('FIRST=aaa');
  });
});
