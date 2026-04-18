import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerRandomizeCommand, generateRandom } from './randomize';

vi.mock('../../crypto/vault', () => ({
  openVault: vi.fn(),
  updateVault: vi.fn(),
}));

vi.mock('readline', () => ({
  createInterface: vi.fn(() => ({
    question: (_: string, cb: (a: string) => void) => cb('secret'),
    close: vi.fn(),
  })),
}));

import { openVault, updateVault } from '../../crypto/vault';

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerRandomizeCommand(program);
  return program;
}

describe('generateRandom', () => {
  it('returns string of correct length', () => {
    expect(generateRandom(16, 'alphanumeric')).toHaveLength(16);
  });

  it('uses numeric charset', () => {
    const val = generateRandom(20, 'numeric');
    expect(val).toMatch(/^[0-9]+$/);
  });

  it('uses alpha charset', () => {
    const val = generateRandom(20, 'alpha');
    expect(val).toMatch(/^[a-zA-Z]+$/);
  });

  it('falls back to special for unknown charset', () => {
    expect(generateRandom(10, 'unknown')).toHaveLength(10);
  });
});

describe('randomize command', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(openVault).mockResolvedValue({ entries: { EXISTING: 'val' } } as any);
    vi.mocked(updateVault).mockResolvedValue(undefined);
  });

  it('generates and sets a random value', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'randomize', 'vault.env', 'API_KEY', '-p', 'secret', '-l', '24', '-c', 'alphanumeric']);
    expect(updateVault).toHaveBeenCalledOnce();
    const entries = vi.mocked(updateVault).mock.calls[0][2] as Record<string, string>;
    expect(entries['API_KEY']).toHaveLength(24);
    expect(entries['API_KEY']).toMatch(/^[a-zA-Z0-9]+$/);
  });

  it('preserves existing entries', async () => {
    const program = buildProgram();
    await program.parseAsync(['node', 'test', 'randomize', 'vault.env', 'NEW_KEY', '-p', 'secret']);
    const entries = vi.mocked(updateVault).mock.calls[0][2] as Record<string, string>;
    expect(entries['EXISTING']).toBe('val');
  });
});
