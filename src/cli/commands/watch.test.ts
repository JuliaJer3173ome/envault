import { Command } from 'commander';
import { registerWatchCommand } from './watch';
import * as crypto from '../../crypto';
import * as ttl from './ttl';
import * as fs from 'fs';

jest.mock('../../crypto');
jest.mock('./ttl');
jest.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerWatchCommand(program);
  return program;
}

describe('watch command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('exits if password is missing', async () => {
    const program = buildProgram();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    await expect(
      program.parseAsync(['node', 'test', 'watch', 'my.vault'])
    ).rejects.toThrow();
  });

  it('exits if vault file does not exist', async () => {
    const program = buildProgram();
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['node', 'test', 'watch', 'missing.vault', '--password', 'pass'])
    ).rejects.toThrow();
    exitSpy.mockRestore();
  });

  it('reports expired keys on start', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.statSync as jest.Mock).mockReturnValue({ mtimeMs: 1000 });
    (crypto.openVault as jest.Mock).mockResolvedValue({ KEY1: 'val1', KEY2: 'val2' });
    (ttl.getExpiredKeys as jest.Mock).mockReturnValue(['KEY1']);

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});

    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'watch', 'my.vault', '--password', 'pass', '--interval', '99999']);

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('KEY1'));
    warnSpy.mockRestore();
  });
});
