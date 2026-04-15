import { Command } from 'commander';
import { registerCopyCommand } from './copy';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCopyCommand(program);
  return program;
}

jest.mock('../../crypto/vault');

const mockOpenVault = vault.openVault as jest.MockedFunction<typeof vault.openVault>;
const mockUpdateVault = vault.updateVault as jest.MockedFunction<typeof vault.updateVault>;

describe('copy command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(process, 'exit').mockImplementation((code?: number) => { throw new Error(`exit:${code}`); });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('copies an existing key to a new key', async () => {
    mockOpenVault.mockResolvedValue({ secrets: { FOO: 'bar' } } as any);
    mockUpdateVault.mockResolvedValue(undefined);

    await buildProgram().parseAsync(['copy', 'FOO', 'BAR', '-p', 'secret'], { from: 'user' });

    expect(mockUpdateVault).toHaveBeenCalledWith('.envault', 'secret', { FOO: 'bar', BAR: 'bar' });
    expect(console.log).toHaveBeenCalledWith('Copied "FOO" to "BAR" successfully.');
  });

  it('errors if source key does not exist', async () => {
    mockOpenVault.mockResolvedValue({ secrets: {} } as any);

    await expect(
      buildProgram().parseAsync(['copy', 'MISSING', 'NEW_KEY', '-p', 'secret'], { from: 'user' })
    ).rejects.toThrow('exit:1');

    expect(console.error).toHaveBeenCalledWith('Error: Key "MISSING" not found in vault.');
  });

  it('errors if destination key already exists', async () => {
    mockOpenVault.mockResolvedValue({ secrets: { FOO: 'bar', BAR: 'baz' } } as any);

    await expect(
      buildProgram().parseAsync(['copy', 'FOO', 'BAR', '-p', 'secret'], { from: 'user' })
    ).rejects.toThrow('exit:1');

    expect(console.error).toHaveBeenCalledWith('Error: Key "BAR" already exists. Use set to overwrite.');
  });

  it('errors if vault cannot be opened', async () => {
    mockOpenVault.mockRejectedValue(new Error('Invalid password'));

    await expect(
      buildProgram().parseAsync(['copy', 'FOO', 'BAR', '-p', 'wrong'], { from: 'user' })
    ).rejects.toThrow('exit:1');

    expect(console.error).toHaveBeenCalledWith('Error: Invalid password');
  });
});
