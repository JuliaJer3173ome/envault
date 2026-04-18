import { Command } from 'commander';
import { registerReloadCommand, reloadVault } from './reload';
import * as crypto from '../../crypto';
import * as fs from 'fs';

jest.mock('../../crypto');
jest.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerReloadCommand(program);
  return program;
}

describe('reloadVault', () => {
  beforeEach(() => jest.clearAllMocks());

  it('parses env file and merges with vault entries', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('NEW_KEY=hello\nEXISTING=world\n');
    (crypto.openVault as jest.Mock).mockResolvedValue({ entries: { EXISTING: 'old' } });
    const result = await reloadVault('vault.env', '.env', 'pass');
    expect(result['NEW_KEY']).toBe('hello');
    expect(result['EXISTING']).toBe('world');
  });

  it('throws if env file not found', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(false);
    await expect(reloadVault('vault.env', '.env', 'pass')).rejects.toThrow('File not found');
  });

  it('ignores comment lines', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('# comment\nKEY=val\n');
    (crypto.openVault as jest.Mock).mockResolvedValue({ entries: {} });
    const result = await reloadVault('vault.env', '.env', 'pass');
    expect(result['KEY']).toBe('val');
    expect(Object.keys(result)).not.toContain('# comment');
  });

  it('strips quotes from values', async () => {
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue('KEY="quoted value"\n');
    (crypto.openVault as jest.Mock).mockResolvedValue({ entries: {} });
    const result = await reloadVault('vault.env', '.env', 'pass');
    expect(result['KEY']).toBe('quoted value');
  });
});
