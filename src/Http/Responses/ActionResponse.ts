import type { AnyRecord, UnknownRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ActionResponse extends AvonResponse {
  constructor(data: UnknownRecord, meta: AnyRecord = {}) {
    super(200, data, meta);
  }
}
