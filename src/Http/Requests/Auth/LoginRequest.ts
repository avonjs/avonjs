import { RequestTypes } from '../../../Contracts';
import AvonRequest from '../AvonRequest';

export default class LoginRequest extends AvonRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ActionRequest;
  }
}
