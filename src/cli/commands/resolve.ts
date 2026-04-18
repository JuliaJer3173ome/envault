import { Command } from 'commander';
import { readVault, openVault } from '../../crypto/vault';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    process.stderr.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function resolveValue(template: string, entries: Record<string, string>): string {
  return template.replace(/\$\{([^}]+)\}/g, (_, key) => {
    return key in entries ? entries[key] : `\${${key}}`;
  });
}

export function registerResolveCommand(program: Command): void {
  program
    .command('resolve <vault> <template>')
    .description('Resolve a template string by substituting vault values')
    .option('-p, --password <password>', 'vault password')
    .action(async (vaultPath: string, template: string, opts) => {
      try {
        const password = opts.password ?? await promptPassword('Password: ');
        const encrypted = readVault(vaultPath);
        const entries = openVault(encrypted, password);
        const result = resolveValue(template, entries);
        console.log(result);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
