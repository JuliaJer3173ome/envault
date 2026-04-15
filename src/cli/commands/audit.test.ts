import { Command } from 'commander';
import { auditVault, AuditResult } from './audit';

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  return program;
}

const mockEntries: Record<string, string> = {
  API_KEY: 'secret123',
  DB_URL: 'postgres://localhost/db',
  DEBUG: 'true',
};

const mockTags: Record<string, string[]> = {
  API_KEY: ['production', 'sensitive'],
  DB_URL: ['production'],
  DEBUG: [],
};

describe('auditVault', () => {
  it('returns an audit result for each entry', () => {
    const results = auditVault('/fake/vault.env', mockEntries, mockTags);
    expect(results).toHaveLength(3);
    expect(results.map((r) => r.key)).toEqual(expect.arrayContaining(['API_KEY', 'DB_URL', 'DEBUG']));
  });

  it('marks all entries as presentInVault', () => {
    const results = auditVault('/fake/vault.env', mockEntries, mockTags);
    results.forEach((r) => expect(r.presentInVault).toBe(true));
  });

  it('assigns correct tags to each entry', () => {
    const results = auditVault('/fake/vault.env', mockEntries, mockTags);
    const apiKey = results.find((r) => r.key === 'API_KEY')!;
    expect(apiKey.tags).toEqual(['production', 'sensitive']);
  });

  it('returns empty tags array when key has no tags', () => {
    const results = auditVault('/fake/vault.env', mockEntries, mockTags);
    const debug = results.find((r) => r.key === 'DEBUG')!;
    expect(debug.tags).toEqual([]);
  });

  it('sets lastModified to null when no history exists', () => {
    const results = auditVault('/nonexistent/vault.env', mockEntries, {});
    results.forEach((r) => expect(r.lastModified).toBeNull());
  });

  it('returns empty array for empty vault', () => {
    const results = auditVault('/fake/vault.env', {}, {});
    expect(results).toHaveLength(0);
  });

  it('defaults to empty tags when tags record is missing key', () => {
    const results = auditVault('/fake/vault.env', { ONLY_KEY: 'val' }, {});
    expect(results[0].tags).toEqual([]);
  });
});
