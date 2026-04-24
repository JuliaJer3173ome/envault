import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerAliasCommand, readAliases } from './alias';

const ALIAS_FILE = path.join(os.homedir(), '.envault', 'aliases.json');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerAliasCommand(program);
  return program;
}

describe('alias integration', () => {
  const backupFile = ALIAS_FILE + '.bak';

  beforeEach(() => {
    if (fs.existsSync(ALIAS_FILE)) {
      fs.copyFileSync(ALIAS_FILE, backupFile);
      fs.unlinkSync(ALIAS_FILE);
    }
  });

  afterEach(() => {
    if (fs.existsSync(ALIAS_FILE)) fs.unlinkSync(ALIAS_FILE);
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, ALIAS_FILE);
      fs.unlinkSync(backupFile);
    }
  });

  it('set and resolve alias round-trip', () => {
    const program = buildProgram();
    const tmpVault = path.resolve('/tmp/integration-test.vault');
    program.parse(['alias', 'set', 'inttest', tmpVault], { from: 'user' });
    const aliases = readAliases();
    expect(aliases['inttest']).toBe(tmpVault);
  });

  it('set then remove alias', () => {
    const program = buildProgram();
    program.parse(['alias', 'set', 'todelete', '/tmp/todelete.vault'], { from: 'user' });
    program.parse(['alias', 'remove', 'todelete'], { from: 'user' });
    const aliases = readAliases();
    expect(aliases['todelete']).toBeUndefined();
  });

  it('list shows all aliases', () => {
    const program = buildProgram();
    program.parse(['alias', 'set', 'a1', '/tmp/a1.vault'], { from: 'user' });
    program.parse(['alias', 'set', 'a2', '/tmp/a2.vault'], { from: 'user' });
    const aliases = readAliases();
    expect(Object.keys(aliases)).toContain('a1');
    expect(Object.keys(aliases)).toContain('a2');
  });

  it('remove non-existent alias exits with error', () => {
    const program = buildProgram();
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    expect(() =>
      program.parse(['alias', 'remove', 'doesnotexist'], { from: 'user' })
    ).toThrow();
    exitSpy.mockRestore();
  });
});
