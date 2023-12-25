import {
  command,
  copy,
  ensureModelDirectoryExists,
  ensureResourceDirectoryExists,
} from '../helpers';
import { join } from 'path';

export default command('make:model')
  .arguments('<modelName>')
  .description('Create a new model')
  .action((name, options) => {
    ensureModelDirectoryExists(options.dir);
    // move file
    copy('model', join('models', name), options, (content: string) => {
      return content.replaceAll('__NAME__', name);
    });
  });
