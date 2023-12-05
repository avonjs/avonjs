import AvonResponse from './AvonResponse';

export default class ResourceStoreResponse extends AvonResponse {
  constructor(data: Record<any, any>, meta: Record<string, any> = {}) {
    super(201, data, meta);
  }
}
