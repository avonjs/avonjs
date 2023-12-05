import ResponsableException from './ResponsableException';
import Response from '../Http/Responses/AvonResponse';
import { collect } from 'collect.js';
import ErrorResponse from '../Http/Responses/ErrorResponse';
import { ValidationError, ValidationErrorItem } from 'joi';
import AvonRequest from '../Http/Requests/AvonRequest';

export default class ValidationException extends ResponsableException {
  constructor(protected errors: ValidationError) {
    super('The given data was invalid.');
  }

  /**
   * Get the response code
   */
  public getCode(): number {
    return 422;
  }

  /**
   * Get the exception name
   */
  public getName(): string {
    return 'UnprocessableContent';
  }

  /**
   * Create an HTTP response that represents the object.
   */
  public toResponse(request: AvonRequest): Response {
    return new ErrorResponse(
      this.getCode(),
      this.getName(),
      this.message,
    ).withMeta(
      'errors',
      collect<ValidationErrorItem>(this.errors.details)
        .mapWithKeys((error: ValidationErrorItem) => [
          error.path,
          error.message,
        ])
        .all(),
    );
  }
}
