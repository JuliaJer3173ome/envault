import { Command } from 'commander';
import { registerInitCommand } from './commands/init';
import { registerSetCommand } from './commands/set';
import { registerGetCommand } from './commands/get';
import { registerListCommand } from './commands/list';
import { registerDeleteCommand } from './commands/delete';
import { registerExportCommand } from './commands/export';
import { registerImportCommand } from './commands/import';
import { registerRotateCommand } from './commands/rotate';

const program = new Command();

program
  .name('envault')
  .description('Securely manage and share .env files using encrypted vaults')
  .version('1.0.0');

registerInitCommand(program);
registerSetCommand(program);
registerGetCommand(program);
registerListCommand(program);
registerDeleteCommand(program);
registerExportCommand(program);
registerImportCommand(program);
registerRotateCommand(program);

program.parse(process.argv);
