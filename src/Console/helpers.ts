import { Command, Option, OptionValues } from 'commander';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

export const command = (command: string) => {
  return new Command(command)
    .option('-d, --dir <directory>', 'output directory', basePath())
    .option('-f, --force', 'Force to create file')
    .addOption(
      new Option('-o, --output <output>', 'File output type')
        .choices(['typescript', 'ecmascript', 'commonjs'])
        .default(moduleType()),
    );
};

const sourceDirectory = () => readPackage().sourceDir;
const basePath = () => join(sourceDirectory(), 'avonjs');
const moduleType = () => {
  const packageJson = readPackage();

  if (
    'typescript' in packageJson.dependencies ||
    'typescript' in packageJson.devDependencies
  ) {
    return 'typescript';
  } else if (packageJson.type === 'module') {
    return 'ecmascript';
  } else {
    return 'commonjs';
  }
};

const readPackage = () => {
  const filename = join(process.cwd(), 'package.json');
  const defaults = { sourceDir: 'src', dependencies: {}, devDependencies: {} };

  if (!existsSync(filename)) {
    return defaults;
  }

  try {
    const packageData = readFileSync(filename, 'utf8');

    return { ...defaults, ...JSON.parse(packageData) };
  } catch (err) {
    console.error('Error reading package.json:', err);
    return defaults;
  }
};

export const ensureDirectoryExists = (directoryPath: string): void => {
  if (!existsSync(directoryPath)) {
    try {
      mkdirSync(directoryPath, { recursive: true });
      console.info(`Directory '${directoryPath}' created.`);
    } catch (err) {
      console.error(`Error creating directory '${directoryPath}':`, err);
    }
  }
};

export const ensureResourceDirectoryExists = (directory?: string): void => {
  ensureDirectoryExists(
    join(process.cwd(), directory ?? basePath(), 'resources'),
  );
};

export const ensureModelDirectoryExists = (directory?: string): void => {
  ensureDirectoryExists(join(process.cwd(), directory ?? basePath(), 'models'));
};

export const exists = (path: string, directory?: string): boolean => {
  return existsSync(join(process.cwd(), directory ?? basePath(), path));
};

export const copy = (
  stub: string,
  path: string,
  options: OptionValues,
  callback = (content: string) => content,
) => {
  const filename = `${path}.${options.output === 'typescript' ? 'ts' : 'js'}`;
  const file = join(process.cwd(), options.dir ?? basePath(), filename);

  if (exists(filename, options.dir) && !options.force) {
    console.error(`File ${file} already exists`);
    return;
  }

  writeFileSync(file, Buffer.from(callback(readStub(stub, options))));
  console.info(`File ${file} created`);
};

export const readStub = (stub: string, options: OptionValues) => {
  const stubBuffer = readFileSync(
    join(dirname(dirname(__dirname)), 'stubs', options.output, stub),
  );

  return stubBuffer.toString();
};
