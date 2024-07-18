import { UnknownRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ActionResponse extends AvonResponse {
  constructor(data: UnknownRecord, meta: Record<string, any> = {}) {
    super(200, data, meta);
  }
}
