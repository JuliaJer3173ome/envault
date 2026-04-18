import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerReloadCommand } from './reload';
import { registerInitCommand } from './init';
import { registerGetCommand } from './get';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerReloadCommand(program);
  registerGetCommand(program);
  return program;
}

describe('reload integration', () => {
  let tmpDir: string;
  let vaultPath: string;
  let envPath: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-reload-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    envPath = path.join(tmpDir, '.env');
  });

  afterEach(() => fs.rmSync(tmpDir, { recursive: true }));

  it('reloads new keys into an existing vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', 'secret']);
    fs.writeFileSync(envPath, 'RELOAD_KEY=reloaded_value\n');
    await program.parseAsync(['node', 'test', 'reload', vaultPath, envPath, '-p', 'secret']);
    const out: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => out.push(args.join(' ')));
    await program.parseAsync(['node', 'test', 'get', vaultPath, 'RELOAD_KEY', '-p', 'secret']);
    expect(out.join('')).toContain('reloaded_value');
    (console.log as jest.Mock).mockRestore();
  });

  it('does not overwrite existing keys without --overwrite flag', async () => {
    const { registerSetCommand } = await import('./set');
    const p2 = buildProgram();
    registerSetCommand(p2);
    await p2.parseAsync(['node', 'test', 'init', vaultPath, '-p', 'secret']);
    await p2.parseAsync(['node', 'test', 'set', vaultPath, 'KEY', 'original', '-p', 'secret']);
    fs.writeFileSync(envPath, 'KEY=overwritten\n');
    await p2.parseAsync(['node', 'test', 'reload', vaultPath, envPath, '-p', 'secret']);
    const out: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((...args) => out.push(args.join(' ')));
    await p2.parseAsync(['node', 'test', 'get', vaultPath, 'KEY', '-p', 'secret']);
    expect(out.join('')).toContain('original');
    (console.log as jest.Mock).mockRestore();
  });
});
