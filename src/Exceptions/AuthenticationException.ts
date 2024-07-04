import ResponsableException from './ResponsableException';

export default class AuthenticationException extends ResponsableException {
  constructor(protected error?: Error) {
    super(error?.message ?? 'The user is unauthenticated.');
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
