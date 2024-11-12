import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ResourceUpdateResponse extends AvonResponse {
  constructor(data: AnyRecord, meta: AnyRecord = {}) {
    super(200, data, meta);
  }
}
