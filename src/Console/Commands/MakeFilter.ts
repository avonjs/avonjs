import { OptionValues } from 'commander';
import { command, copy, ensureFilterDirectoryExists } from '../helpers';
import { join } from 'path';

export default command('make:filter')
  .arguments('<filterName>')
  .description('Create a new filter')
  .option('--select', 'Make a select filter')
  .option('--boolean', 'Make a select filter')
  .option('--range', 'Make a select filter')
  .action((name, options) => {
    ensureFilterDirectoryExists(options.dir);
    // move file
    copy(
      chooseStub(options),
      join('filters', name),
      options,
      (content: string) => content.replaceAll('__NAME__', name),
    );
  });

const chooseStub = (options: OptionValues): string => {
  const parts = ['filter'];

  if (options.select) {
    parts.push('select');
  }
  if (options.boolean) {
    parts.push('boolean');
  }
  if (options.range) {
    parts.push('range');
  }

  return parts.join('-');
};
