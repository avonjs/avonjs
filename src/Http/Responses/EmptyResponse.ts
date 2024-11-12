import type { AnyRecord } from '../../Contracts';
import AvonResponse from './AvonResponse';

export default class EmptyResponse extends AvonResponse {
  constructor(meta: AnyRecord = {}) {
    super(204, {}, meta);
  }
}
