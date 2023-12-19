import AvonResponse from '../AvonResponse';

export default class LoginResponse extends AvonResponse {
  constructor(data: Record<any, any>, meta: Record<string, any> = {}) {
    super(200, data, meta);
  }
}
