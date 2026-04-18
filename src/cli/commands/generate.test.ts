import { Command } from 'commander';
import { registerGenerateCommand, generatePassword } from './generate';
import * as vault from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerGenerateCommand(program);
  return program;
}

describe('generatePassword', () => {
  it('returns a string of the requested length', () => {
    const result = generatePassword(16, { alpha: true, numeric: true, special: false });
    expect(result).toHaveLength(16);
  });

  it('only uses numeric chars when alpha/special disabled', () => {
    const result = generatePassword(20, { alpha: false, numeric: true, special: false });
    expect(result).toMatch(/^[0-9]+$/);
  });

  it('falls back to alphanumeric if no charset selected', () => {
    const result = generatePassword(10, { alpha: false, numeric: false, special: false });
    expect(result).toHaveLength(10);
  });

  it('includes special characters when requested', () => {
    const results = Array.from({ length: 50 }, () =>
      generatePassword(20, { alpha: false, numeric: false, special: true })
    );
    const hasSpecial = results.some((r) => /[!@#$%^&*]/.test(r));
    expect(hasSpecial).toBe(true);
  });
});

describe('generate command', () => {
  beforeEach(() => {
    jest.spyOn(vault, 'openVault').mockResolvedValue({ EXISTING: 'value' });
    jest.spyOn(vault, 'updateVault').mockResolvedValue(undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  it('generates a value and stores it', async () => {
    const program = buildProgram();
    const log = jest.spyOn(console, 'log').mockImplementation();
    await program.parseAsync(['generate', 'my.vault', 'NEW_KEY', '-p', 'secret', '-l', '16'], { from: 'user' });
    expect(vault.updateVault).toHaveBeenCalled();
    const call = (vault.updateVault as jest.Mock).mock.calls[0];
    expect(call[2]).toHaveProperty('NEW_KEY');
    expect((call[2] as any).NEW_KEY).toHaveLength(16);
    log.mockRestore();
  });

  it('exits on invalid length', async () => {
    const program = buildProgram();
    jest.spyOn(console, 'error').mockImplementation();
    const exit = jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(
      program.parseAsync(['generate', 'my.vault', 'KEY', '-p', 'secret', '-l', 'abc'], { from: 'user' })
    ).rejects.toThrow();
    expect(exit).toHaveBeenCalledWith(1);
    exit.mockRestore();
  });
});
