import { RequestTypes } from '../../Contracts';
import ResourceSoftDeleteRequest from './ResourceSoftDeleteRequest';

export default class ResourceReviewRequest extends ResourceSoftDeleteRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ResourceReviewRequest;
  }
}
