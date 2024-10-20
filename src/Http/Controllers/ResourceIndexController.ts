import { Ability } from '../../Contracts';
import type ResourceIndexRequest from '../Requests/ResourceIndexRequest';
import type { AvonResponse } from '../Responses';
import ResourceIndexResponse from '../Responses/ResourceIndexResponse';
import Controller from './Controller';

export default class ResourceIndexController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ResourceIndexRequest): Promise<AvonResponse> {
    const resource = request.resource();

    await resource.authorizeTo(request, Ability.viewAny);

    const { resources, count } = await request.searchIndex();

    return new ResourceIndexResponse(resources, {
      count,
      currentPage: request.currentPage(),
      perPage: request.perPage(),
      perPageOptions: resource.perPageOptions(),
    });
  }
}
