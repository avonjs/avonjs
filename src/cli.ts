#!/usr/bin/env node
import { program } from 'commander';
import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import Avon from './Avon';

program
  .command('version')
  .description('Get the application version')
  .action(() => console.log(Avon.version()));

const registerCommandsIn = (directory: string) => {
  const files = readdirSync(directory);
  // check directories
  for (const file of files) {
    const filePath = join(directory, file);
    const stat = statSync(filePath);
    // check sub directories
    if (stat.isDirectory()) {
      registerCommandsIn(filePath);
      continue;
    }
    // check file type
    if (!['.js'].includes(extname(file))) {
      continue;
    }
    // Define your CLI commands using Commander.js
    const { default: command } = require(filePath);
    program.addCommand(command);
  }
  // run cli
  program.parse(process.argv);
};

registerCommandsIn(join(__dirname, 'Console', 'Commands'));
