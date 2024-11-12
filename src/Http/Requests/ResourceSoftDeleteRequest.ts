import type { Model, SoftDeletes } from '../../Contracts';
import type { Repository } from '../../Repositories';
import AvonRequest from './AvonRequest';

export default abstract class ResourceSoftDeleteRequest extends AvonRequest<
  Repository<Model> & SoftDeletes<Model>
> {
  /**
   * Find the model instance for the request.
   */
  public findModelQuery(resourceId?: number) {
    return super.findModelQuery(resourceId).onlyTrashed();
  }
}
