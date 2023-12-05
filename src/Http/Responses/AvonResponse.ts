export default abstract class AvonResponse {
  /**
   * Indicates custom headers.
   */
  protected headers: Record<string, any> = {};

  constructor(
    public code: number,
    public data: Record<string | number, any> = {},
    public meta: Record<string, any> = {},
  ) {}

  /**
   * Merge the given meta into the response meta.
   */
  public withMeta(meta: string | Record<string, any>, value?: any) {
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
  public content(): Record<string, any> {
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
  public getHeaders(): Record<string, any> {
    return this.headers;
  }

  /**
   * Append header value to response.
   */
  public withHeader(key: string, value: any): this {
    this.headers[key] = value;

    return this;
  }
}
