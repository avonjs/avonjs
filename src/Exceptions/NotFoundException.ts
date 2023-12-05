import ResponsableException from './ResponsableException';

export default class NotFoundException extends ResponsableException {
  /**
   * Get the response code
   */
  public getCode(): number {
    return 404;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'NotFound';
  }
}
