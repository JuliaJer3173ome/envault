import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { openVault, writeVault } from '../../crypto/vault';

export type VaultPermission = 'read' | 'write' | 'admin';

export interface PermissionEntry {
  identity: string;
  permission: VaultPermission;
}

export function getPermissionsFilePath(vaultPath: string): string {
  return vaultPath.replace(/\.vault$/, '.permissions.json');
}

export function readPermissions(vaultPath: string): PermissionEntry[] {
  const filePath = getPermissionsFilePath(vaultPath);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

export function writePermissions(vaultPath: string, entries: PermissionEntry[]): void {
  const filePath = getPermissionsFilePath(vaultPath);
  fs.writeFileSync(filePath, JSON.stringify(entries, null, 2));
}

export function setPermission(vaultPath: string, identity: string, permission: VaultPermission): PermissionEntry[] {
  const entries = readPermissions(vaultPath);
  const idx = entries.findIndex(e => e.identity === identity);
  if (idx >= 0) {
    entries[idx].permission = permission;
  } else {
    entries.push({ identity, permission });
  }
  writePermissions(vaultPath, entries);
  return entries;
}

export function revokePermission(vaultPath: string, identity: string): PermissionEntry[] {
  const entries = readPermissions(vaultPath).filter(e => e.identity !== identity);
  writePermissions(vaultPath, entries);
  return entries;
}

function promptPassword(prompt: string): Promise<string> {
  return new Promise(resolve => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, answer => { rl.close(); resolve(answer); });
  });
}

export function registerChmodCommand(program: Command): void {
  program
    .command('chmod <vault> <identity> <permission>')
    .description('Set access permission for an identity on a vault (read|write|admin)')
    .option('-p, --password <password>', 'vault password')
    .option('--revoke', 'revoke permission for the identity')
    .action(async (vaultPath: string, identity: string, permission: string, opts) => {
      const validPerms: VaultPermission[] = ['read', 'write', 'admin'];
      if (!opts.revoke && !validPerms.includes(permission as VaultPermission)) {
        console.error(`Invalid permission "${permission}". Must be one of: ${validPerms.join(', ')}`);
        process.exit(1);
      }
      const password = opts.password ?? await promptPassword('Password: ');
      try {
        await openVault(vaultPath, password);
      } catch {
        console.error('Failed to open vault. Check your password.');
        process.exit(1);
      }
      if (opts.revoke) {
        revokePermission(vaultPath, identity);
        console.log(`Revoked permissions for "${identity}" on ${vaultPath}`);
      } else {
        setPermission(vaultPath, identity, permission as VaultPermission);
        console.log(`Set permission "${permission}" for "${identity}" on ${vaultPath}`);
      }
    });
}
