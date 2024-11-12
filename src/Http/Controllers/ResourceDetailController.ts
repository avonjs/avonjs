import { Ability } from '../../Contracts';
import ModelNotFoundException from '../../Exceptions/ModelNotFoundException';
import type ResourceDetailRequest from '../Requests/ResourceDetailRequest';
import type { AvonResponse } from '../Responses';
import ResourceDetailResponse from '../Responses/ResourceDetailResponse';
import Controller from './Controller';

export default class ResourceDetailController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ResourceDetailRequest): Promise<AvonResponse> {
    request
      .logger()
      ?.dump(`Searching on "${request.resourceName()}" repository ...`);

    const model = await request
      .resource()
      .detailQuery(request, request.findModelQuery())
      .first();

    ModelNotFoundException.unless(model);

    const resource = request.newResource(model);

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.view}" access on "${request.resourceName()}".`,
      );

    await resource.authorizeTo(request, Ability.view);

    request.logger()?.dump('Resolving resource fields ...');

    await Promise.all(
      resource
        .detailFields(request, model)
        .withOnlyLazyFields()
        .map((field) => field.resolveForResources(request, [model])),
    );

    request.logger()?.dump('Preparing response ...');

    return new ResourceDetailResponse(
      await resource.serializeForDetail(request),
    );
  }
}
