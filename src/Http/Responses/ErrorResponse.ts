import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ErrorResponse extends AvonResponse {
  constructor(
    public code: number,
    protected name: string,
    protected message: string,
    protected error?: Error,
  ) {
    super(code);
  }

  /**
   * Get content for response.
   */
  public content(): AnyRecord {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
      meta: {
        ...this.meta,
        stack: this.error,
      },
    };
  }
}
