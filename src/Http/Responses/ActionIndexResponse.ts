import type { AnyRecord, SerializedAction } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ActionIndexResponse extends AvonResponse {
  constructor(data: SerializedAction[], meta: AnyRecord = {}) {
    super(200, data, meta);
  }
}
