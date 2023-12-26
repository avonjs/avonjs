import { command, copy, ensureActionDirectoryExists } from '../helpers';
import { join } from 'path';

export default command('make:action')
  .arguments('<actionName>')
  .description('Create a new action')
  .option('--select', 'Make a select action')
  .option('--boolean', 'Make a select action')
  .option('--range', 'Make a select action')
  .action((name, options) => {
    ensureActionDirectoryExists(options.dir);
    // move file
    copy('action', join('actions', name), options, (content: string) => {
      return content.replaceAll('__NAME__', name);
    });
  });
