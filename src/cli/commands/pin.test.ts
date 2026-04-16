import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fs from 'fs';
import { pinVault, unpinVault, readPins, resolveAlias } from './pin';

vi.mock('fs');

const mockPins: Record<string, string> = {};

beforeEach(() => {
  Object.keys(mockPins).forEach((k) => delete mockPins[k]);
  vi.mocked(fs.existsSync).mockReturnValue(true);
  vi.mocked(fs.readFileSync).mockImplementation(() => JSON.stringify(mockPins));
  vi.mocked(fs.writeFileSync).mockImplementation((_p, data) => {
    const parsed = JSON.parse(data as string);
    Object.assign(mockPins, parsed);
    Object.keys(mockPins).forEach((k) => {
      if (!parsed[k]) delete mockPins[k];
    });
  });
});

describe('pinVault', () => {
  it('adds an alias', () => {
    pinVault('myapp', '/home/user/myapp.vault');
    expect(fs.writeFileSync).toHaveBeenCalled();
  });
});

describe('unpinVault', () => {
  it('returns false if alias not found', () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce('{}');
    expect(unpinVault('nonexistent')).toBe(false);
  });

  it('returns true and removes alias if found', () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({ myapp: '/path/to/vault' }));
    expect(unpinVault('myapp')).toBe(true);
  });
});

describe('resolveAlias', () => {
  it('returns path for known alias', () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce(JSON.stringify({ myapp: '/path/to/vault' }));
    expect(resolveAlias('myapp')).toBe('/path/to/vault');
  });

  it('returns undefined for unknown alias', () => {
    vi.mocked(fs.readFileSync).mockReturnValueOnce('{}');
    expect(resolveAlias('unknown')).toBeUndefined();
  });
});

describe('readPins', () => {
  it('returns empty object when file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValueOnce(false);
    expect(readPins()).toEqual({});
  });
});
