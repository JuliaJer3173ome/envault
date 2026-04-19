import { Command } from 'commander';
import { openVault, writeVault } from '../../crypto/vault';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => { rl.close(); resolve(answer); });
  });
}

export function namespaceEntries(
  entries: Record<string, string>,
  ns: string
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    result[`${ns}_${k}`] = v;
  }
  return result;
}

export function stripNamespace(
  entries: Record<string, string>,
  ns: string
): Record<string, string> {
  const prefix = `${ns}_`;
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(entries)) {
    if (k.startsWith(prefix)) {
      result[k.slice(prefix.length)] = v;
    } else {
      result[k] = v;
    }
  }
  return result;
}

export function registerNamespaceCommand(program: Command): void {
  const ns = program.command('namespace').description('Manage key namespaces in a vault');

  ns.command('add <vault> <namespace>')
    .description('Prefix all keys with a namespace')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, namespace: string, opts) => {
      const password = opts.password || await promptPassword('Password: ');
      const vault = await openVault(vaultPath, password);
      vault.entries = namespaceEntries(vault.entries, namespace);
      await writeVault(vaultPath, vault);
      console.log(`Namespace "${namespace}" applied to all keys.`);
    });

  ns.command('strip <vault> <namespace>')
    .description('Remove namespace prefix from all matching keys')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, namespace: string, opts) => {
      const password = opts.password || await promptPassword('Password: ');
      const vault = await openVault(vaultPath, password);
      vault.entries = stripNamespace(vault.entries, namespace);
      await writeVault(vaultPath, vault);
      console.log(`Namespace "${namespace}" stripped from keys.`);
    });
}
