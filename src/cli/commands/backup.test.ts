import { Command } from 'commander';
import { registerBackupCommand, getBackupPath } from './backup';
import * as fs from 'fs';

jest.mock('fs');

const mockedFs = fs as jest.Mocked<typeof fs>;

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerBackupCommand(program);
  return program;
}

describe('getBackupPath', () => {
  it('includes vault base name and timestamp', () => {
    const result = getBackupPath('/some/dir/my.vault');
    expect(result).toMatch(/my\.backup-.*\.vault$/);
  });

  it('includes label when provided', () => {
    const result = getBackupPath('/some/dir/my.vault', 'pre-release');
    expect(result).toMatch(/my\.backup-pre-release-.*\.vault$/);
  });

  it('places backup in the same directory as the source vault', () => {
    const result = getBackupPath('/some/dir/my.vault');
    expect(result).toMatch(/^\/some\/dir\//);
  });
});

describe('backup command', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a backup copy of the vault', async () => {
    mockedFs.existsSync.mockImplementation((p) => p === 'my.vault');
    mockedFs.copyFileSync.mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'backup', 'my.vault'], { from: 'user' });

    expect(mockedFs.copyFileSync).toHaveBeenCalledWith('my.vault', expect.stringMatching(/\.backup-.*\.vault$/));
  });

  it('exits if vault does not exist', async () => {
    mockedFs.existsSync.mockReturnValue(false);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'backup', 'missing.vault'], { from: 'user' })).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });

  it('exits if backup destination already exists', async () => {
    mockedFs.existsSync.mockReturnValue(true);
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });

    const program = buildProgram();
    await expect(
      program.parseAsync(['node', 'test', 'backup', 'my.vault', '--output', 'existing.vault'], { from: 'user' })
    ).rejects.toThrow();
    expect(mockExit).toHaveBeenCalledWith(1);
    mockExit.mockRestore();
  });
});
