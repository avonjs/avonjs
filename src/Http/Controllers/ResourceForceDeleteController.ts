import { Ability } from '../../Contracts';
import type ResourceForceDeleteRequest from '../Requests/ResourceForceDeleteRequest';
import { type AvonResponse, EmptyResponse } from '../Responses';
import Controller from './Controller';

export default class ResourceForceDeleteController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceForceDeleteRequest,
  ): Promise<AvonResponse> {
    const resource = await request.findResourceOrFail();

    await resource.authorizeTo(request, Ability.forceDelete);

    await request
      .repository()
      .transaction<void>(async (repository, transaction) => {
        // handle prunable fields
        // await Promise.all(
        //   resource
        //     .prunableFields(request, false)
        //     .map((field) => field.forRequest(request)),
        // );

        await resource.beforeForceDelete(request, transaction);

        await repository.forceDelete(resource.resource.getKey());

        await resource.afterForceDelete(request, transaction);

        await resource.flushActionEvents(transaction);
      });

    await resource.deleted(request);

    return new EmptyResponse();
  }
}
