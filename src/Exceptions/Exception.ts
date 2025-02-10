import type { AnyValue } from '../Contracts';

export default class Exception extends Error {
  constructor(
    public message = 'Something went wrong.',
    ...args: readonly unknown[]
  ) {
    super(message);
  }

  /**
   * Throw the Exception.
   */
  static throw(message?: string, ...args: readonly unknown[]): void {
    //TODO: should fix this.
    // biome-ignore lint/complexity/noThisInStatic: This is a static method.
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
      //TODO: should fix this.
      // biome-ignore lint/complexity/noThisInStatic: This is a static method.
      this.throw(message, ...args);
    }
  }

  /**
   * Generate an Exception if the given condition is not satisfied.
   */
  static unless(
    condition: AnyValue,
    message?: string,
    ...args: readonly unknown[]
  ): asserts condition {
    if (!condition) {
      //TODO: should fix this.
      // biome-ignore lint/complexity/noThisInStatic: This is a static method.
      this.throw(message, ...args);
    }
  }
}
