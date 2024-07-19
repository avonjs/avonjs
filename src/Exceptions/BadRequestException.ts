import ResponsableException from './ResponsableException';

export default class BadRequestException extends ResponsableException {
  constructor(public message = 'Request payload are invalid.') {
    super(message);
  }

  /**
   * Get the response code
   */
  public getCode(): number {
    return 400;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'BadRequest';
  }
}
