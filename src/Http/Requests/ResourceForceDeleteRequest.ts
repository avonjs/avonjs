import { Repository } from '../../Repositories';
import { Model, RequestTypes, SoftDeletes } from '../../Contracts';
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
    const repository = super.findModelQuery(resourceId) as Repository<Model> &
      SoftDeletes<Model>;

    return repository.withTrashed();
  }
}
