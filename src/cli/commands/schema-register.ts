import { Command } from 'commander';
import { registerShareCommand } from './share';

export function registerAllCommands(program: Command): void {
  registerShareCommand(program);
}
