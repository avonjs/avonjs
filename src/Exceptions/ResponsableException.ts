import Response from '../Http/Responses/AvonResponse';
import ErrorResponse from '../Http/Responses/ErrorResponse';
import Exception from './Exception';

export default abstract class ResponsableException extends Exception {
  /**
   * Create an HTTP response that represents the object.
   */
  public toResponse(): Response {
    return new ErrorResponse(
      this.getCode(),
      this.getName(),
      this.message,
      this,
    );
  }

  /**
   * Get the response code
   */
  public abstract getCode(): number;

  /**
   * Get the exception name
   */
  public abstract getName(): string;
}
