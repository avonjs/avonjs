import type { AnyRecord, IndexSerializedResource } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ResourceIndexResponse extends AvonResponse {
  constructor(data: IndexSerializedResource[], meta: AnyRecord = {}) {
    super(200, data, meta);
  }
}
