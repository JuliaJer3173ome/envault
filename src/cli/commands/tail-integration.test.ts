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

/**
 * Creates a temporary vault directory, initializes it, and populates it with
 * the given key-value pairs using the provided password.
 * Returns the path to the created vault file.
 */
async function createPopulatedVault(
  program: Command,
  dir: string,
  password: string,
  entries: Array<[string, string]>
): Promise<string> {
  const vaultPath = path.join(dir, 'test.ev');
  await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', password]);
  for (const [key, value] of entries) {
    await program.parseAsync(['node', 'test', 'set', vaultPath, key, value, '-p', password]);
  }
  return vaultPath;
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
    const program = buildProgram();

    const vaultPath = await createPopulatedVault(program, dir, 'secret', [
      ['FIRST', 'aaa'],
      ['SECOND', 'bbb'],
      ['THIRD', 'ccc'],
    ]);

    const logs = await captureConsoleLogs(() =>
      program.parseAsync(['node', 'test', 'tail', vaultPath, '-n', '2', '-p', 'secret'])
    );

    expect(logs).toContain('SECOND=bbb');
    expect(logs).toContain('THIRD=ccc');
    expect(logs).not.toContain('FIRST=aaa');
  });
});
