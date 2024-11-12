import { type Model, RequestTypes, type SoftDeletes } from '../../Contracts';
import type { Repository } from '../../Repositories';
import ResourceSoftDeleteRequest from './ResourceSoftDeleteRequest';

export default class ResourceForceDeleteRequest extends ResourceSoftDeleteRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ResourceForceDeleteRequest;
  }

  /**
   * Find the model instance for the request.
   */
  public findModelQuery(resourceId?: number) {
    return super.findModelQuery(resourceId).withTrashed();
  }
}
