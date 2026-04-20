import { Command } from 'commander';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { registerInitCommand } from './init';
import { registerPatchCommand } from './patch';
import { registerGetCommand } from './get';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerInitCommand(program);
  registerPatchCommand(program);
  registerGetCommand(program);
  return program;
}

describe('patch integration', () => {
  let tmpDir: string;
  let vaultPath: string;
  let patchPath: string;

  beforeEach(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-patch-'));
    vaultPath = path.join(tmpDir, 'test.vault');
    patchPath = path.join(tmpDir, 'changes.env');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'init', vaultPath, '-p', 'testpass']);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('applies patch entries and they are retrievable', async () => {
    fs.writeFileSync(patchPath, 'API_KEY=abc123\nDEBUG=true\n');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'patch', vaultPath, patchPath, '-p', 'testpass']);

    const getProgram = buildProgram();
    const logs: string[] = [];
    jest.spyOn(console, 'log').mockImplementation((msg) => logs.push(msg));
    await getProgram.parseAsync(['node', 'test', 'get', vaultPath, 'API_KEY', '-p', 'testpass']);
    expect(logs.some((l) => l.includes('abc123'))).toBe(true);
    jest.restoreAllMocks();
  });

  it('dry-run does not persist changes', async () => {
    fs.writeFileSync(patchPath, 'SECRET=should_not_save\n');
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'patch', vaultPath, patchPath, '-p', 'testpass', '--dry-run']);

    const getProgram = buildProgram();
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      getProgram.parseAsync(['node', 'test', 'get', vaultPath, 'SECRET', '-p', 'testpass'])
    ).rejects.toThrow();
    mockExit.mockRestore();
  });
});
