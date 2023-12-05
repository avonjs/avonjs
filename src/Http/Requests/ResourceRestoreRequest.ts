import { RequestTypes } from '../../contracts';
import ResourceSoftDeleteRequest from './ResourceSoftDeleteRequest';

export default class ResourceRestoreRequest extends ResourceSoftDeleteRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ResourceRestoreRequest;
  }
}
