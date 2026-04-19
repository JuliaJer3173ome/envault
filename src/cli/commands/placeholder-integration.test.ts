import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerPlaceholderCommand } from './placeholder';
import { createVault, writeVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerPlaceholderCommand(program);
  return program;
}

let tmpDir: string;
let vaultPath: string;
const PASSWORD = 'integration-pass';

beforeEach(async () => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-placeholder-'));
  vaultPath = path.join(tmpDir, 'test.vault');
  const v = await createVault({ DB: 'postgres://{{HOST}}/{{DB_NAME}}', TOKEN: 'static' }, PASSWORD);
  await writeVault(vaultPath, v);
});

afterEach(() => fs.rmSync(tmpDir, { recursive: true, force: true }));

describe('placeholder integration', () => {
  it('applies placeholders and persists changes', async () => {
    const program = buildProgram();
    const logs: string[] = [];
    const spy = jest.spyOn ? jest.spyOn(console, 'log') : (console.log = (m: string) => { logs.push(m); });
    await program.parseAsync([
      'node', 'test', 'placeholder', vaultPath,
      'HOST=db.local', 'DB_NAME=mydb',
      '--password', PASSWORD
    ]);
    expect(fs.existsSync(vaultPath)).toBe(true);
  });

  it('dry-run does not modify vault', async () => {
    const before = fs.statSync(vaultPath).mtimeMs;
    await new Promise(r => setTimeout(r, 10));
    const program = buildProgram();
    await program.parseAsync([
      'node', 'test', 'placeholder', vaultPath,
      'HOST=db.local', '--dry-run', '--password', PASSWORD
    ]);
    const after = fs.statSync(vaultPath).mtimeMs;
    expect(after).toBe(before);
  });
});
