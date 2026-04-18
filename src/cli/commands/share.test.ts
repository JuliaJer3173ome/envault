import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerShareCommand, generateShareBundle } from './share';

vi.mock('../../crypto', () => ({
  openVault: vi.fn().mockResolvedValue({ API_KEY: 'abc', DB_PASS: 'secret', TOKEN: 'tok' }),
  createVault: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./share', async (importOriginal) => {
  const mod = await importOriginal() as any;
  return { ...mod, promptPassword: vi.fn().mockResolvedValue('testpass') };
});

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerShareCommand(program);
  return program;
}

describe('generateShareBundle', () => {
  it('returns subset of entries for given keys', () => {
    const entries = { A: '1', B: '2', C: '3' };
    const bundle = generateShareBundle('vault.env', ['A', 'C'], entries) as any;
    expect(bundle.entries).toEqual({ A: '1', C: '3' });
    expect(bundle.source).toBe('vault.env');
  });

  it('ignores missing keys', () => {
    const entries = { A: '1' };
    const bundle = generateShareBundle('vault.env', ['A', 'Z'], entries) as any;
    expect(Object.keys(bundle.entries)).toEqual(['A']);
  });

  it('includes exportedAt timestamp', () => {
    const bundle = generateShareBundle('v.env', ['A'], { A: '1' }) as any;
    expect(bundle.exportedAt).toBeDefined();
  });
});

describe('share command', () => {
  const { openVault, createVault } = vi.mocked(await import('../../crypto'));

  beforeEach(() => vi.clearAllMocks());

  it('shares all keys when no --keys provided', async () => {
    const program = buildProgram();
    await program.parseAsync(['share', 'vault.env', 'out.env', '-p', 'pass', '-P', 'sharepass'], { from: 'user' });
    expect(createVault).toHaveBeenCalledWith('out.env', 'sharepass', { API_KEY: 'abc', DB_PASS: 'secret', TOKEN: 'tok' });
  });

  it('shares only specified keys', async () => {
    const program = buildProgram();
    await program.parseAsync(['share', 'vault.env', 'out.env', '-p', 'pass', '-P', 'sharepass', '-k', 'API_KEY,TOKEN'], { from: 'user' });
    const call = (createVault as any).mock.calls[0];
    expect(Object.keys(call[2])).toEqual(['API_KEY', 'TOKEN']);
  });
});
