import ModelNotFoundException from '../../Exceptions/ModelNotFoundException';
import { Ability } from '../../contracts';
import ResourceReviewRequest from '../Requests/ResourceReviewRequest';
import { AvonResponse } from '../Responses';
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
        .reviewFields(request, model!)
        .withOnlyRelatableFields()
        .map((field) => field.resolveRelatables(request, [model!])),
    );

    return new ResourceReviewResponse(
      await resource.serializeForReview(request),
    );
  }
}
