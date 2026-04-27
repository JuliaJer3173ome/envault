import { Command } from 'commander';
import { shuffleEntries, registerShuffleCommand } from './shuffle';
import * as vault from '../../crypto/vault';
import * as init from './init';

jest.mock('../../crypto/vault');
jest.mock('./init');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerShuffleCommand(program);
  return program;
}

describe('shuffleEntries', () => {
  it('returns an object with the same keys', () => {
    const entries = { A: '1', B: '2', C: '3', D: '4' };
    const result = shuffleEntries(entries);
    expect(Object.keys(result).sort()).toEqual(Object.keys(entries).sort());
  });

  it('preserves values for each key', () => {
    const entries = { FOO: 'bar', BAZ: 'qux' };
    const result = shuffleEntries(entries);
    expect(result.FOO).toBe('bar');
    expect(result.BAZ).toBe('qux');
  });

  it('returns empty object for empty input', () => {
    expect(shuffleEntries({})).toEqual({});
  });

  it('returns single entry unchanged', () => {
    expect(shuffleEntries({ ONLY: 'one' })).toEqual({ ONLY: 'one' });
  });
});

describe('shuffle command', () => {
  const mockVault = { entries: { KEY1: 'val1', KEY2: 'val2', KEY3: 'val3' } };

  beforeEach(() => {
    jest.clearAllMocks();
    (vault.openVault as jest.Mock).mockResolvedValue({ ...mockVault, entries: { ...mockVault.entries } });
    (vault.writeVault as jest.Mock).mockResolvedValue(undefined);
    (init.promptPassword as jest.Mock).mockResolvedValue('secret');
  });

  it('shuffles and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'shuffle', 'my.vault', '--password', 'secret']);
    expect(vault.openVault).toHaveBeenCalledWith('my.vault', 'secret');
    expect(vault.writeVault).toHaveBeenCalled();
  });

  it('prints keys on dry-run without writing', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'shuffle', 'my.vault', '--password', 'secret', '--dry-run']);
    expect(vault.writeVault).not.toHaveBeenCalled();
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('dry-run'));
    spy.mockRestore();
  });

  it('prompts for password when not provided', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'shuffle', 'my.vault']);
    expect(init.promptPassword).toHaveBeenCalled();
  });

  it('exits on vault error', async () => {
    (vault.openVault as jest.Mock).mockRejectedValue(new Error('bad password'));
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'shuffle', 'my.vault', '--password', 'wrong'])).rejects.toThrow();
    expect(exitSpy).toHaveBeenCalledWith(1);
    exitSpy.mockRestore();
  });
});
