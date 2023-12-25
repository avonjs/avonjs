import { IndexSerializedResource } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class ResourceIndexResponse extends AvonResponse {
  constructor(data: IndexSerializedResource[], meta: Record<string, any> = {}) {
    super(200, data, meta);
  }
}
