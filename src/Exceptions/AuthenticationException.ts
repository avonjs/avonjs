import ResponsableException from './ResponsableException';

export default class AuthenticationException extends ResponsableException {
  protected error?: Error;
  constructor(error?: Error | string) {
    if (typeof error === 'string') {
      super(error);
      this.error = new Error(error);
    } else {
      super(error?.message ?? 'The user is unauthenticated.');
      this.error = error;
    }
  }

  /**
   * Get the response code
   */
  public getCode(): number {
    return 401;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'Unauthenticated';
  }
}
