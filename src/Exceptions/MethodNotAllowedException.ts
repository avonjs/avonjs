import ResponsableException from './ResponsableException';

export default class MethodNotAllowedException extends ResponsableException {
  constructor(
    public message = 'The requested method is not supported for this endpoint.',
  ) {
    super(message);
  }

  /**
   * Get the response code
   */
  public getCode(): number {
    return 405;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'MethodNotAllowed';
  }
}
