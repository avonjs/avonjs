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

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.viewAny}" access on "${request.resourceName()}".`,
      );

    await resource.authorizeTo(request, Ability.viewAny);

    request
      .logger()
      ?.dump(`Searching on "${request.resourceName()}" repository ...`);

    const { resources, count } = await request.searchIndex();

    request.logger()?.dump('Preparing response ...');

    return new ResourceIndexResponse(resources, {
      count,
      currentPage: request.currentPage(),
      perPage: request.perPage(),
      perPageOptions: resource.perPageOptions(),
    });
  }
}
