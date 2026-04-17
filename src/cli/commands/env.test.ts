import { Command } from 'commander';
import { registerEnvCommand, buildEnvString } from './env';
import * as crypto from '../../crypto';
import * as lock from './lock';
import * as pin from './pin';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('../../crypto');
jest.mock('./lock');
jest.mock('./pin');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerEnvCommand(program);
  return program;
}

describe('buildEnvString', () => {
  it('returns all entries as KEY=VALUE', () => {
    expect(buildEnvString({ A: '1', B: '2' })).toBe('A=1\nB=2');
  });

  it('filters by keys when provided', () => {
    expect(buildEnvString({ A: '1', B: '2', C: '3' }, ['A', 'C'])).toBe('A=1\nC=3');
  });
});

describe('env command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (lock.isLocked as jest.Mock).mockReturnValue(false);
    (pin.resolveAlias as jest.Mock).mockReturnValue(null);
    (crypto.openVault as jest.Mock).mockResolvedValue({ DB_URL: 'postgres://localhost', SECRET: 'abc' });
  });

  it('prints KEY=VALUE pairs', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', 'vault.env', '--password', 'pass']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('DB_URL=postgres://localhost'));
    spy.mockRestore();
  });

  it('prefixes with export when --export flag is set', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', 'vault.env', '--password', 'pass', '--export']);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('export DB_URL='));
    spy.mockRestore();
  });

  it('filters keys with --keys option', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation();
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'env', 'vault.env', '--password', 'pass', '--keys', 'SECRET']);
    const output = spy.mock.calls[0][0] as string;
    expect(output).toContain('SECRET=abc');
    expect(output).not.toContain('DB_URL');
    spy.mockRestore();
  });

  it('exits if vault not found', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    const spy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    const program = buildProgram();
    await expect(program.parseAsync(['node', 'test', 'env', 'missing.env', '--password', 'pass'])).rejects.toThrow();
    spy.mockRestore();
  });
});
