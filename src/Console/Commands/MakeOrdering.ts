import { command, copy, ensureOrderingDirectoryExists } from '../helpers';
import { join } from 'path';

export default command('make:ordering')
  .arguments('<orderingName>')
  .description('Create a new ordering')
  .action((name, options) => {
    ensureOrderingDirectoryExists(options.dir);
    // move file
    copy('ordering', join('orderings', name), options, (content: string) => {
      return content.replaceAll('__NAME__', name);
    });
  });
