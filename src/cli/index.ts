#!/usr/bin/env node
import { Command } from 'commander';
import { registerInitCommand } from './commands/init';

const pkg = require('../../package.json');

const program = new Command();

program
  .name('envault')
  .description('Securely manage and share .env files across teams using encrypted vaults')
  .version(pkg.version ?? '0.1.0');

registerInitCommand(program);

program.parseAsync(process.argv).catch((err: Error) => {
  if ((err as any).code === 'commander.helpDisplayed' ||
      (err as any).code === 'commander.version') {
    process.exit(0);
  }
  console.error('Error:', err.message);
  process.exit(1);
});
