export default class Exception extends Error {
  constructor(message?: string, ...args: readonly unknown[]) {
    super(message ?? 'Something went wrong.');
  }

  /**
   * Throw the Exception.
   */
  static throw(message?: string, ...args: readonly unknown[]): void {
    throw new this(message, ...args);
  }

  /**
   * Generate an Exception if the given condition is satisfied.
   */
  static when(
    condition: boolean,
    message?: string,
    ...args: readonly unknown[]
  ): void {
    if (condition) {
      this.throw(message, ...args);
    }
  }

  /**
   * Generate an Exception if the given condition is not satisfied.
   */
  static unless(
    condition: any,
    message?: string,
    ...args: readonly unknown[]
  ): asserts condition {
    if (!condition) {
      this.throw(message, ...args);
    }
  }
}
