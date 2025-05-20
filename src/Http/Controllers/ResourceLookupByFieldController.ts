import type ResourceLookupByFieldRequest from '../Requests/ResourceLookupByFieldRequest';
import type { AvonResponse } from '../Responses';
import ResourceDetailController from './ResourceDetailController';

export default class ResourceLookupByFieldController extends ResourceDetailController {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceLookupByFieldRequest,
  ): Promise<AvonResponse> {
    return super.__invoke(request);
  }
}
