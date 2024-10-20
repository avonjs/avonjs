import { Ability } from '../../Contracts';
import ModelNotFoundException from '../../Exceptions/ModelNotFoundException';
import type ResourceReviewRequest from '../Requests/ResourceReviewRequest';
import type { AvonResponse } from '../Responses';
import ResourceReviewResponse from '../Responses/ResourceReviewResponse';
import Controller from './Controller';

export default class ResourceReviewController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ResourceReviewRequest): Promise<AvonResponse> {
    const model = await request
      .resource()
      .reviewQuery(request, request.findModelQuery())
      .first();

    ModelNotFoundException.unless(model);

    const resource = request.newResource(model);

    await resource.authorizeTo(request, Ability.review);

    await Promise.all(
      resource
        .reviewFields(request, model)
        .onlyLoadedLazyFields()
        .map((field) => field.resolveForResources(request, [model])),
    );

    return new ResourceReviewResponse(
      await resource.serializeForReview(request),
    );
  }
}
