import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerEnvCommand } from './env';
import { registerInitCommand } from './init';
import { registerSetCommand } from './set';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerSetCommand(program);
  registerEnvCommand(program);
  return program;
}

describe('env command integration', () => {
  let tmpDir: string;
  let vaultPath: string;
  const password = 'integration-pass';

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-env-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', vaultPath, '--password', password]);
    const p2 = buildProgram();
    await p2.parseAsync(['node', 'test', 'set', vaultPath, 'API_KEY', 'mykey123', '--password', password]);
    const p3 = buildProgram();
    await p3.parseAsync(['node', 'test', 'set', vaultPath, 'DB_HOST', 'localhost', '--password', password]);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('outputs all keys as KEY=VALUE', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', vaultPath, '--password', password]);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('API_KEY=mykey123');
    expect(output).toContain('DB_HOST=localhost');
    spy.mockRestore();
  });

  it('outputs only requested keys', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', vaultPath, '--password', password, '--keys', 'API_KEY']);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('API_KEY=mykey123');
    expect(output).not.toContain('DB_HOST');
    spy.mockRestore();
  });
});
