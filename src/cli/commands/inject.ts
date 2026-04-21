import { Command } from 'commander';
import { openVault } from '../../crypto/vault';
import { execSync } from 'child_process';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

export function buildEnvArgs(entries: Record<string, string>): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  for (const [key, value] of Object.entries(entries)) {
    env[key] = value;
  }
  return env;
}

export function registerInjectCommand(program: Command): void {
  program
    .command('inject <vault> <cmd...>')
    .description('Run a command with vault secrets injected as environment variables')
    .option('-p, --password <password>', 'vault password')
    .option('--prefix <prefix>', 'only inject keys with given prefix')
    .option('--strip-prefix', 'strip the prefix from injected key names', false)
    .action(async (vaultPath: string, cmd: string[], options) => {
      try {
        const password = options.password ?? await promptPassword('Password: ');
        const vault = await openVault(vaultPath, password);
        let entries = vault.entries as Record<string, string>;

        if (options.prefix) {
          const filtered: Record<string, string> = {};
          for (const [k, v] of Object.entries(entries)) {
            if (k.startsWith(options.prefix)) {
              const newKey = options.stripPrefix ? k.slice(options.prefix.length) : k;
              filtered[newKey] = v;
            }
          }
          entries = filtered;
        }

        const env = buildEnvArgs(entries);
        const command = cmd.join(' ');
        execSync(command, { env, stdio: 'inherit' });
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
