import { Command } from 'commander';
import { registerWhoamiCommand, readIdentity, writeIdentity, Identity } from './whoami';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const IDENTITY_FILE = path.join(os.homedir(), '.envault', 'identity.json');

function buildProgram() {
  const program = new Command();
  program.exitOverride();
  registerWhoamiCommand(program);
  return program;
}

beforeEach(() => {
  if (fs.existsSync(IDENTITY_FILE)) fs.unlinkSync(IDENTITY_FILE);
});

afterEach(() => {
  if (fs.existsSync(IDENTITY_FILE)) fs.unlinkSync(IDENTITY_FILE);
});

test('shows message when no identity set', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['whoami'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith(expect.stringContaining('No identity set'));
  spy.mockRestore();
});

test('sets name and email', () => {
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['whoami', '--set-name', 'Alice', '--set-email', 'alice@example.com'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith('Identity updated.');
  const identity = readIdentity();
  expect(identity?.name).toBe('Alice');
  expect(identity?.email).toBe('alice@example.com');
  spy.mockRestore();
});

test('displays stored identity', () => {
  const identity: Identity = { name: 'Bob', email: 'bob@example.com', createdAt: '2024-01-01T00:00:00.000Z' };
  writeIdentity(identity);
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log;
  program.parse(['whoami'], { from: 'user' });
  expect(spy).toHaveBeenCalledWith('Name:    Bob');
  expect(spy).toHaveBeenCalledWith('Email:   bobspy.mockRestore();
});

test('clears identity', () => {
  writeIdentity({ name: 'Bob', email: 'bob@example.com', createdAt: '2024-01-01T00:00:00.000Z' });
  const program = buildProgram();
  const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
  program.parse(['whoami', '--clear'], { from: 'user' });
  expect(readIdentity()).toBeNull();
  spy.mockRestore();
});
