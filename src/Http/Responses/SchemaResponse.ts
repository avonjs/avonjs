import AvonResponse from './AvonResponse';

export default class SchemaResponse extends AvonResponse {
  constructor(data: Record<any, any>, meta: Record<string, any> = {}) {
    super(200, data, meta);
  }

  /**
   * Get content for response.
   */
  public content(): Record<string, any> {
    return this.data;
  }
}
