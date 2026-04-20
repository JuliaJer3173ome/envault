import { describe, it, expect } from 'vitest';
import { Command } from 'commander';
import { intersectEntries, registerIntersectCommand } from './intersect';

describe('intersectEntries', () => {
  const a = { FOO: 'bar', BAZ: 'qux', SHARED: 'same' };
  const b = { FOO: 'different', SHARED: 'same', ONLY_B: 'val' };

  it('returns keys present in both vaults', () => {
    const result = intersectEntries(a, b);
    expect(Object.keys(result)).toContain('FOO');
    expect(Object.keys(result)).toContain('SHARED');
    expect(Object.keys(result)).not.toContain('BAZ');
    expect(Object.keys(result)).not.toContain('ONLY_B');
  });

  it('uses value from vault A', () => {
    const result = intersectEntries(a, b);
    expect(result['FOO']).toBe('bar');
  });

  it('filters by matching values when valuesMatch=true', () => {
    const result = intersectEntries(a, b, true);
    expect(Object.keys(result)).toContain('SHARED');
    expect(Object.keys(result)).not.toContain('FOO');
  });

  it('returns empty object when no common keys', () => {
    const result = intersectEntries({ A: '1' }, { B: '2' });
    expect(result).toEqual({});
  });

  it('returns empty object when valuesMatch=true and no values match', () => {
    const result = intersectEntries({ A: '1' }, { A: '2' }, true);
    expect(result).toEqual({});
  });
});

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerIntersectCommand(program);
  return program;
}

describe('registerIntersectCommand', () => {
  it('registers the intersect command', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'intersect');
    expect(cmd).toBeDefined();
  });

  it('intersect command has --values flag', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'intersect')!;
    const valuesOpt = cmd.options.find((o) => o.long === '--values');
    expect(valuesOpt).toBeDefined();
  });

  it('intersect command has --json flag', () => {
    const program = buildProgram();
    const cmd = program.commands.find((c) => c.name() === 'intersect')!;
    const jsonOpt = cmd.options.find((o) => o.long === '--json');
    expect(jsonOpt).toBeDefined();
  });
});
