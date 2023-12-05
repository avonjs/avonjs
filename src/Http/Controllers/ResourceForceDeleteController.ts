import { Ability } from '../../contracts';
import ResourceForceDeleteRequest from '../Requests/ResourceForceDeleteRequest';
import { AvonResponse, EmptyResponse } from '../Responses';
import Controller from './Controller';

export default class ResourceForceDeleteController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceForceDeleteRequest,
  ): Promise<AvonResponse> {
    const resource = await request.findResourceOrFail();
    const repository = request.repository();

    await resource.authorizeTo(request, Ability.forceDelete);

    await repository.transaction<void>(async () => {
      // handle prunable fields
      // await Promise.all(
      //   resource
      //     .prunableFields(request, false)
      //     .map((field) => field.forRequest(request)),
      // );

      await resource.beforeForceDelete(request);

      await repository.forceDelete(resource.resource.getKey());

      await resource.afterForceDelete(request);

      await resource.flushActionEvents();
    });

    return new EmptyResponse();
  }
}
