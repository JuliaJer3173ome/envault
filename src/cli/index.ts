#!/usr/bin/env node
import { Command } from 'commander';
import { registerInitCommand } from './commands/init';
import { registerSetCommand } from './commands/set';
import { registerGetCommand } from './commands/get';
import { registerListCommand } from './commands/list';
import { registerDeleteCommand } from './commands/delete';
import { registerExportCommand } from './commands/export';
import { registerImportCommand } from './commands/import';
import { registerRotateCommand } from './commands/rotate';
import { registerRenameCommand } from './commands/rename';
import { registerCopyCommand } from './commands/copy';
import { registerMoveCommand } from './commands/move';
import { registerInfoCommand } from './commands/info';
import { registerSearchCommand } from './commands/search';
import { registerDiffCommand } from './commands/diff';
import { registerMergeCommand } from './commands/merge';
import { registerTagCommand } from './commands/tag';
import { registerHistoryCommand } from './commands/history';
import { registerAuditCommand } from './commands/audit';
import { registerPinCommand } from './commands/pin';

const program = new Command();

program.name('envault').description('Securely manage and share .env files').version('1.0.0');

registerInitCommand(program);
registerSetCommand(program);
registerGetCommand(program);
registerListCommand(program);
registerDeleteCommand(program);
registerExportCommand(program);
registerImportCommand(program);
registerRotateCommand(program);
registerRenameCommand(program);
registerCopyCommand(program);
registerMoveCommand(program);
registerInfoCommand(program);
registerSearchCommand(program);
registerDiffCommand(program);
registerMergeCommand(program);
registerTagCommand(program);
registerHistoryCommand(program);
registerAuditCommand(program);
registerPinCommand(program);

program.parse(process.argv);
