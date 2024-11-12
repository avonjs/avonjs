import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ResourceAssociationResponse extends AvonResponse {
  constructor(data: Array<AnyRecord>, meta: AnyRecord = {}) {
    super(200, data, meta);
  }
}
