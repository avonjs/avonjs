import AvonResponse from './AvonResponse';

export default class EmptyResponse extends AvonResponse {
  constructor(meta: Record<string, any> = {}) {
    super(204, {}, meta);
  }
}
