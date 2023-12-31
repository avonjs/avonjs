import { RequestTypes } from '../../Contracts';
import AvonRequest from './AvonRequest';

export default class ResourceDeleteRequest extends AvonRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ResourceDeleteRequest;
  }
}
