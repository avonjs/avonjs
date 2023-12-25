import { SerializedAction } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ActionIndexResponse extends AvonResponse {
  constructor(data: SerializedAction[], meta: Record<string, any> = {}) {
    super(200, data, meta);
  }
}
