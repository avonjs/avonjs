import ResponsableException from './ResponsableException';

export default class ForbiddenException extends ResponsableException {
  message = 'This action is unauthorized.';

  /**
   * Get the response code
   */
  public getCode(): number {
    return 403;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'Forbidden';
  }
}
