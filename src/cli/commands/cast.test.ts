import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Command } from 'commander';
import { castValue, castEntries, registerCastCommand } from './cast';
import * as vault from '../../crypto/vault';

vi.mock('../../crypto/vault');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerCastCommand(program);
  return program;
}

describe('castValue', () => {
  it('casts to number', () => {
    expect(castValue('42', 'number')).toBe('42');
    expect(castValue('3.14', 'number')).toBe('3.14');
  });

  it('throws on invalid number', () => {
    expect(() => castValue('abc', 'number')).toThrow();
  });

  it('casts truthy values to boolean true', () => {
    for (const v of ['true', '1', 'yes', 'on']) {
      expect(castValue(v, 'boolean')).toBe('true');
    }
  });

  it('casts falsy values to boolean false', () => {
    for (const v of ['false', '0', 'no', 'off']) {
      expect(castValue(v, 'boolean')).toBe('false');
    }
  });

  it('throws on invalid boolean', () => {
    expect(() => castValue('maybe', 'boolean')).toThrow();
  });

  it('returns valid json as-is', () => {
    expect(castValue('{"a":1}', 'json')).toBe('{"a":1}');
  });

  it('wraps plain string as json string', () => {
    expect(castValue('hello', 'json')).toBe('"hello"');
  });

  it('casts to string', () => {
    expect(castValue('anything', 'string')).toBe('anything');
  });
});

describe('castEntries', () => {
  it('casts specified keys', () => {
    const entries = { PORT: '8080', DEBUG: 'true', NAME: 'app' };
    const result = castEntries(entries, ['PORT'], 'number');
    expect(result.PORT).toBe('8080');
    expect(result.DEBUG).toBe('true');
  });

  it('throws if key not found', () => {
    expect(() => castEntries({}, ['MISSING'], 'string')).toThrow('Key "MISSING" not found');
  });
});

describe('cast command', () => {
  beforeEach(() => {
    vi.mocked(vault.openVault).mockResolvedValue({ entries: { PORT: '8080' }, metadata: {} } as any);
    vi.mocked(vault.writeVault).mockResolvedValue(undefined);
  });

  it('casts a key and writes vault', async () => {
    const program = buildProgram();
    await program.parseAsync(['cast', 'number', 'PORT', '-v', 'vault.env', '-p', 'pass'], { from: 'user' });
    expect(vault.writeVault).toHaveBeenCalled();
  });

  it('exits on invalid type', async () => {
    const program = buildProgram();
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(program.parseAsync(['cast', 'xml', 'PORT', '-v', 'vault.env', '-p', 'pass'], { from: 'user' })).rejects.toThrow();
    mockExit.mockRestore();
  });
});
