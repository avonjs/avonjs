import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class SuccessfulResponse extends AvonResponse {
  constructor(message = 'Your action successfully ran.', meta: AnyRecord = {}) {
    super(200, { message }, meta);
  }
}
