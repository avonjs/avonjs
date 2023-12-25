import { Repository } from '../../Repositories';
import { Model, SoftDeletes } from '../../Contracts';
import AvonRequest from './AvonRequest';

export default abstract class ResourceSoftDeleteRequest extends AvonRequest {
  /**
   * Get the repository for resource being requested.
   */
  public repository() {
    return super.repository() as Repository<Model> & SoftDeletes<Model>;
  }

  /**
   * Find the model instance for the request.
   */
  public findModelQuery(resourceId?: number) {
    const repository = super.findModelQuery(resourceId) as Repository<Model> &
      SoftDeletes<Model>;

    return repository.onlyTrashed();
  }
}
