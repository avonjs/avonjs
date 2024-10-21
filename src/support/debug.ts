import logger from 'debug';
/**
 * Helper method to log the "error" messages.
 */
export const error = logger('avonjs:error');
/**
 * Helper method to log the "info" messages.
 */
export const info = logger('avonjs:info');
/**
 * Helper method to log the "warn" messages.
 */
export const warn = logger('avonjs:warn');
/**
 * Helper method for "debug" messages.
 */
export const dump = logger('avonjs:debug');

export default {
  error,
  info,
  warn,
  dump,
};
