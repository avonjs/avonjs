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
    const model = await request
      .resource()
      .detailQuery(request, request.findModelQuery())
      .first();

    ModelNotFoundException.unless(model);

    const resource = request.newResource(model);

    await resource.authorizeTo(request, Ability.view);

    await Promise.all(
      resource
        .detailFields(request, model)
        .withOnlyLazyFields()
        .map((field) => field.resolveForResources(request, [model])),
    );

    return new ResourceDetailResponse(
      await resource.serializeForDetail(request),
    );
  }
}
