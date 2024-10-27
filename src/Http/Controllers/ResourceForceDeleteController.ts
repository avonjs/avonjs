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
    request
      .logger()
      ?.dump(`Searching on "${request.resourceName()}" repository ...`);

    const resource = await request.findResourceOrFail();

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.forceDelete}" access on "${request.resourceName()}".`,
      );

    await resource.authorizeTo(request, Ability.forceDelete);

    request.logger()?.dump(`Force deleting "${request.resourceName()}" ...`);

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

    request
      .logger()
      ?.dump(
        `Resource "${request.resourceName()}" by id "${request.resourceId()}" "force deleted".`,
      );

    await resource.deleted(request);

    request.logger()?.dump('Preparing response ...');

    return new EmptyResponse();
  }
}
