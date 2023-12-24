import { command, copy, ensureResourceDirectoryExists } from '../helpers';
import { join } from 'path';

export default command('make:resource')
  .arguments('<resourceName>')
  .description('Create a new resource')
  .action((name, options) => {
    ensureResourceDirectoryExists(options.dir);
    // move file
    copy('resource', join('resources', name), options, (content: string) => {
      return content.replaceAll('__NAME__', name);
    });
  });
