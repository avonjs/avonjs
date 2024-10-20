import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ResourceStoreResponse extends AvonResponse {
  constructor(data: AnyRecord, meta: AnyRecord = {}) {
    super(201, data, meta);
  }
}
