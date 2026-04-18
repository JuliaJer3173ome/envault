import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { openVault } from '../../crypto';
import * as readline from 'readline';

export async function promptPassword(prompt: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(prompt, (ans) => { rl.close(); resolve(ans); }));
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
    if (!(key in vars)) throw new Error(`Missing variable: ${key}`);
    return vars[key];
  });
}

export function registerTemplateCommand(program: Command): void {
  program
    .command('template <vault> <templateFile>')
    .description('Render a template file substituting {{KEY}} placeholders with vault values')
    .option('-o, --output <file>', 'Write rendered output to file instead of stdout')
    .option('-p, --password <password>', 'Vault password')
    .action(async (vaultPath: string, templateFile: string, options) => {
      try {
        if (!fs.existsSync(templateFile)) {
          console.error(`Template file not found: ${templateFile}`);
          process.exit(1);
        }

        const password = options.password ?? await promptPassword('Enter vault password: ');
        const vault = await openVault(vaultPath, password);
        const template = fs.readFileSync(templateFile, 'utf-8');

        let rendered: string;
        try {
          rendered = renderTemplate(template, vault.entries);
        } catch (err: any) {
          console.error(`Render error: ${err.message}`);
          process.exit(1);
        }

        if (options.output) {
          fs.mkdirSync(path.dirname(path.resolve(options.output)), { recursive: true });
          fs.writeFileSync(options.output, rendered, 'utf-8');
          console.log(`Rendered template written to ${options.output}`);
        } else {
          process.stdout.write(rendered);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
