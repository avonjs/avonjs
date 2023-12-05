const { join } = require('path');

/** @type {import('jest').Config} */
const config = {
  globals: {
    RESOURCES: join(__dirname, 'tests', 'Fixtures', 'resources'),
  },
};

module.exports = config;
