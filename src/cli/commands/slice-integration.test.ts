import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { registerSliceCommand } from './slice';
import { registerInitCommand } from './init';
import { registerSetCommand } from './set';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerSetCommand(program);
  registerSliceCommand(program);
  return program;
}

describe('slice integration', () => {
  it('slices entries from a real vault', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-slice-'));
    const vaultPath = path.join(dir, 'test.vault');
    const program = buildProgram();

    await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', 'pass']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'ALPHA', 'one', '-p', 'pass']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'BETA', 'two', '-p', 'pass']);
    await program.parseAsync(['node', 'test', 'set', vaultPath, 'GAMMA', 'three', '-p', 'pass']);

    const lines: string[] = [];
    const orig = console.log;
    console.log = (msg: string) => lines.push(msg);

    await program.parseAsync(['node', 'test', 'slice', vaultPath, '0', '2', '-p', 'pass']);
    console.log = orig;

    expect(lines).toContain('ALPHA=one');
    expect(lines).toContain('BETA=two');
    expect(lines).not.toContain('GAMMA=three');

    fs.rmSync(dir, { recursive: true });
  });
});
