import type { AnyRecord, AnyValue } from '../../Contracts';

export default abstract class AvonResponse {
  /**
   * Indicates custom headers.
   */
  protected headers: AnyRecord = {};

  constructor(
    public code: number,
    public data: Record<string | number, AnyValue> = {},
    public meta: AnyRecord = {},
  ) {}

  /**
   * Merge the given meta into the response meta.
   */
  public withMeta(meta: string | AnyRecord, value?: AnyValue) {
    const mergeValues = typeof meta === 'string' ? { [meta]: value } : meta;

    this.meta = {
      ...mergeValues,
      ...this.meta,
    };

    return this;
  }

  /**
   * Get content for response.
   */
  public content(): AnyRecord {
    return {
      code: this.code,
      data: this.data,
      meta: this.meta,
    };
  }

  /**
   * Get response status code.
   */
  public getStatusCode(): number {
    return this.code;
  }

  /**
   * Get the response headers.
   */
  public getHeaders(): AnyRecord {
    return this.headers;
  }

  /**
   * Append header value to response.
   */
  public withHeader(key: string, value: AnyValue): this {
    this.headers[key] = value;

    return this;
  }
}
