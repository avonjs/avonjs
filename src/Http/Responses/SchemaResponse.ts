import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class SchemaResponse extends AvonResponse {
  constructor(data: AnyRecord, meta: AnyRecord = {}) {
    super(200, data, meta);
  }

  /**
   * Get content for response.
   */
  public content(): AnyRecord {
    return this.data;
  }
}
