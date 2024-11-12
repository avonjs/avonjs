import ResponsableException from './ResponsableException';

export default class InternalServerErrorException extends ResponsableException {
  constructor(public message = 'Something went wrong') {
    super(message);
  }

  /**
   * Get the response code
   */
  public getCode(): number {
    return 500;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'InternalServerError';
  }
}
