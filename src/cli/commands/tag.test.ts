import { Command } from 'commander';
import { registerTagCommand } from './tag';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

jest.mock('fs');
jest.mock('../../crypto/vault');
jest.mock('./tag', () => ({
  ...jest.requireActual('./tag'),
  promptPassword: jest.fn().mockResolvedValue('secret'),
}));

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerTagCommand(program);
  return program;
}

const mockVault = {
  entries: {
    API_KEY: { value: 'abc123', tags: ['production'] },
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  jest.clearAllMocks();
  (fs.existsSync as jest.Mock).mockReturnValue(true);
  (vault.openVault as jest.Mock).mockResolvedValue(mockVault);
  (vault.updateVault as jest.Mock).mockReturnValue(mockVault);
  (vault.writeVault as jest.Mock).mockResolvedValue(undefined);
});

test('adds a tag to an existing key', async () => {
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  await program.parseAsync(['node', 'envault', 'tag', 'API_KEY', 'staging', '-p', 'secret']);
  expect(vault.updateVault).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Added tag'));
  consoleSpy.mockRestore();
});

test('removes a tag with --remove flag', async () => {
  const program = buildProgram();
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  await program.parseAsync(['node', 'envault', 'tag', 'API_KEY', 'production', '--remove', '-p', 'secret']);
  expect(vault.updateVault).toHaveBeenCalled();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Removed tag'));
  consoleSpy.mockRestore();
});

test('exits with error if vault not found', async () => {
  (fs.existsSync as jest.Mock).mockReturnValue(false);
  const program = buildProgram();
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  await expect(program.parseAsync(['node', 'envault', 'tag', 'API_KEY', 'dev', '-p', 'secret'])).rejects.toThrow();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Vault not found'));
  exitSpy.mockRestore();
  consoleSpy.mockRestore();
});

test('exits with error if key not found', async () => {
  const program = buildProgram();
  const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
  await expect(program.parseAsync(['node', 'envault', 'tag', 'MISSING_KEY', 'dev', '-p', 'secret'])).rejects.toThrow();
  expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('not found in vault'));
  exitSpy.mockRestore();
  consoleSpy.mockRestore();
});
