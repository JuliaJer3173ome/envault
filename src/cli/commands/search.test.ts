import { Command } from 'commander';
import { searchEntries, registerSearchCommand } from './search';
import * as crypto from '../../crypto';

jest.mock('../../crypto');

function buildProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerSearchCommand(program);
  return program;
}

const mockEntries = {
  DATABASE_URL: 'postgres://localhost/mydb',
  DATABASE_HOST: 'localhost',
  API_KEY: 'secret-key-123',
  APP_NAME: 'myapp',
};

describe('searchEntries', () => {
  it('matches keys by substring (case-insensitive)', () => {
    const results = searchEntries(mockEntries, 'database', false);
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('DATABASE_HOST');
  });

  it('does not search values when searchValues is false', () => {
    const results = searchEntries(mockEntries, 'localhost', false);
    expect(results).toHaveLength(0);
  });

  it('searches values when searchValues is true', () => {
    const results = searchEntries(mockEntries, 'localhost', true);
    expect(results.map((r) => r.key)).toContain('DATABASE_URL');
    expect(results.map((r) => r.key)).toContain('DATABASE_HOST');
  });

  it('returns empty array when no match', () => {
    const results = searchEntries(mockEntries, 'nonexistent', true);
    expect(results).toHaveLength(0);
  });
});

describe('search command', () => {
  const mockOpenVault = crypto.openVault as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenVault.mockResolvedValue({ entries: mockEntries });
  });

  it('prints matching keys', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['search', 'API', '--password', 'pass'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API_KEY'));
    spy.mockRestore();
  });

  it('prints no results message when nothing matches', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['search', 'NOTHING', '--password', 'pass'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('No entries found'));
    spy.mockRestore();
  });

  it('shows key=value when --values flag is set', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const program = buildProgram();
    await program.parseAsync(['search', 'API_KEY', '--password', 'pass', '--values'], { from: 'user' });
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('API_KEY=secret-key-123'));
    spy.mockRestore();
  });
});
