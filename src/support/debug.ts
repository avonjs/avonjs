import debug from 'debug';
import type { Logger } from '../Contracts';

class Debug implements Logger {
  constructor(
    protected namespace = 'avonjs',
    protected suffix?: string,
  ) {
    //
  }

  /**
   * Extend the log namespace.
   */
  extend(namespace: string) {
    this.suffix = namespace;

    return this;
  }

  /**
   * Log the "error" level messages.
   */
  error(formatter: string, ...args: unknown[]) {
    this.logger('error')(formatter, ...args);

    return this;
  }

  /**
   * Log the "info" level messages.
   */
  info(formatter: string, ...args: unknown[]) {
    this.logger('info')(formatter, ...args);

    return this;
  }

  /**
   * Log the "warn" level messages.
   */
  warn(formatter: string, ...args: unknown[]) {
    this.logger('warn')(formatter, ...args);

    return this;
  }

  /**
   * Log the "error" level messages.
   */
  dump(formatter: string, ...args: unknown[]) {
    this.logger('dump')(formatter, ...args);
    return this;
  }

  /**
   * Make the logger instance.
   */
  private logger(level: string) {
    const logger = debug(this.namespace).extend(level);

    return this.suffix ? logger.extend(this.suffix) : logger;
  }
}

export default new Debug();
