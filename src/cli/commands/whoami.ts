import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const IDENTITY_FILE = path.join(os.homedir(), '.envault', 'identity.json');

export interface Identity {
  name: string;
  email: string;
  createdAt: string;
}

export function readIdentity(): Identity | null {
  if (!fs.existsSync(IDENTITY_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(IDENTITY_FILE, 'utf-8'));
  } catch {
    return null;
  }
}

export function writeIdentity(identity: Identity): void {
  const dir = path.dirname(IDENTITY_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(IDENTITY_FILE, JSON.stringify(identity, null, 2));
}

export function registerWhoamiCommand(program: Command): void {
  const cmd = program.command('whoami');

  cmd
    .description('Show or set the current envault user identity')
    .option('--set-name <name>', 'Set your display name')
    .option('--set-email <email>', 'Set your email address')
    .option('--clear', 'Clear stored identity')
    .action((options) => {
      if (options.clear) {
        if (fs.existsSync(IDENTITY_FILE)) fs.unlinkSync(IDENTITY_FILE);
        console.log('Identity cleared.');
        return;
      }

      const existing = readIdentity() ?? { name: '', email: '', createdAt: new Date().toISOString() };

      if (options.setName || options.setEmail) {
        if (options.setName) existing.name = options.setName;
        if (options.setEmail) existing.email = options.setEmail;
        writeIdentity(existing);
        console.log('Identity updated.');
        return;
      }

      const identity = readIdentity();
      if (!identity) {
        console.log('No identity set. Use --set-name and --set-email to configure.');
        return;
      }
      console.log(`Name:    ${identity.name}`);
      console.log(`Email:   ${identity.email}`);
      console.log(`Since:   ${identity.createdAt}`);
    });
}
