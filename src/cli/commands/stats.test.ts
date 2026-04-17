import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { registerStatsCommand, computeStats } from './stats';
import * as vault from '../../crypto/vault';
import * as fs from 'fs';

vi.mock('../../crypto/vault');
vi.mock('fs');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerStatsCommand(program);
  return program;
}

const mockVault = {
  entries: {
    KEY1: { value: 'val1', tags: ['prod', 'db'] },
    KEY2: { value: 'val2', tags: ['prod'], locked: true },
    KEY3: { value: 'val3' },
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(vault.readVault).mockReturnValue(mockVault as any);
  vi.mocked(fs.statSync).mockReturnValue({ size: 1024 } as any);
});

describe('computeStats', () => {
  it('returns correct total keys', () => {
    const stats = computeStats('test.vault', 'pass');
    expect(stats.totalKeys).toBe(3);
  });

  it('counts locked keys', () => {
    const stats = computeStats('test.vault', 'pass');
    expect(stats.lockedKeys).toBe(1);
  });

  it('counts unique tags', () => {
    const stats = computeStats('test.vault', 'pass');
    expect(stats.uniqueTags).toBe(2);
  });

  it('includes size from fs.statSync', () => {
    const stats = computeStats('test.vault', 'pass');
    expect(stats.sizeBytes).toBe(1024);
  });

  it('includes createdAt and updatedAt', () => {
    const stats = computeStats('test.vault', 'pass');
    expect(stats.createdAt).toBe('2024-01-01T00:00:00Z');
    expect(stats.updatedAt).toBe('2024-06-01T00:00:00Z');
  });
});

describe('stats command', () => {
  it('exits with error when no password provided', async () => {
    const program = buildProgram();
    delete process.env.ENVAULT_PASSWORD;
    await expect(program.parseAsync(['node', 'test', 'stats', 'test.vault'])).rejects.toThrow();
  });
});
