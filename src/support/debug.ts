import debug from 'debug';
import type { Logger } from '../Contracts';

class Debug implements Logger {
  private debuggers: Map<string, debug.Debugger> = new Map();

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
    return new Debug(this.namespace, namespace);
  }

  /**
   * Log the "error" level messages.
   */
  error(formatter: unknown, ...args: unknown[]) {
    this.resolve('error')(formatter, ...args);

    return this;
  }

  /**
   * Log the "info" level messages.
   */
  info(formatter: unknown, ...args: unknown[]) {
    this.resolve('info')(formatter, ...args);

    return this;
  }

  /**
   * Log the "warn" level messages.
   */
  warn(formatter: unknown, ...args: unknown[]) {
    this.resolve('warn')(formatter, ...args);

    return this;
  }

  /**
   * Log the "error" level messages.
   */
  dump(formatter: unknown, ...args: unknown[]) {
    this.resolve('debug')(formatter, ...args);

    return this;
  }

  /**
   * Resolve the logger instance with LRU management.
   */
  private resolve(level: string) {
    const namespaces = [level, this.suffix ?? ''];
    const cacheKey = namespaces.join(':');

    if (!this.debuggers.has(cacheKey)) {
      // Limit cache size to avoid memory leaks
      if (this.debuggers.size >= 1000) {
        // Remove the oldest entry to keep cache within limit
        const oldestKey = this.debuggers.keys().next().value as string;
        this.debuggers.delete(oldestKey);
      }

      this.debuggers.set(
        cacheKey,
        namespaces.reduce(
          (debug, namespace) => (namespace ? debug.extend(namespace) : debug),
          debug(this.namespace),
        ),
      );
    }

    return this.debuggers.get(cacheKey) as debug.Debugger;
  }
}

export default new Debug();
