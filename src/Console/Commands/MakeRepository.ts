import { OptionValues } from 'commander';
import { command, copy, ensureRepositoryDirectoryExists } from '../helpers';
import { join } from 'path';

export default command('make:repository')
  .arguments('<repositoryName>')
  .description('Create a new repository')
  .option('--file', 'Make a file repository')
  .option('--knex', 'Make a knex repository')
  .option('--collection', 'Make a collection repository')
  .option('--soft-deletes', 'Apply soft deletes to the repository')
  .action((name, options) => {
    ensureRepositoryDirectoryExists(options.dir);
    // move file
    copy(
      chooseStub(options),
      join('repositories', name),
      options,
      (content: string) => {
        content = content.replaceAll('__NAME__', name);

        if (!options.softDeletes) {
          content = content
            .replace(', SoftDeletes', '')
            .replace(
              /extends[\s\S(]*Repositories\.(\w+)[^{]*{/,
              'extends Repositories.$1 {',
            );
        }

        return content;
      },
    );
  });

const chooseStub = (options: OptionValues): string => {
  const parts = ['repository'];

  if (options.file) {
    parts.push('file');
  }
  if (options.collection) {
    parts.push('collection');
  }
  if (options.knex) {
    parts.push('knex');
  }

  return parts.join('-');
};
