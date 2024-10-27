import Avon from '../../Avon';
import { Ability } from '../../Contracts';
import type ResourceUpdateOrUpdateAttachedRequest from '../Requests/ResourceUpdateOrUpdateAttachedRequest';
import type { AvonResponse } from '../Responses';
import ResourceUpdateResponse from '../Responses/ResourceUpdateResponse';
import Controller from './Controller';

export default class ResourceUpdateController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceUpdateOrUpdateAttachedRequest,
  ): Promise<AvonResponse> {
    request
      .logger()
      ?.dump(`Searching on "${request.resourceName()}" repository ...`);

    const resource = await request.findResourceOrFail();
    const previous = request.newModel({ ...resource.resource.getAttributes() });

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.update}" access on "${request.resourceName()}".`,
      );

    await resource.authorizeTo(request, Ability.update);

    request.logger()?.dump('Validating request payload for update ...');

    await resource.validateForUpdate(request, resource);

    request.logger()?.dump(`Updating "${request.resourceName()}" ...`);

    const newResource = await request
      .repository()
      .transaction<typeof resource>(async (repository, transaction) => {
        const [model, callbacks] = request
          .resource()
          .fillForUpdate<typeof resource.resource>(request, resource.resource);

        const newResource = request.newResource(model);

        await newResource.beforeUpdate(request, transaction);

        await repository.update(model);

        // Attention:
        // Here we have to run the "callbacks" in order
        // To avoid update/insert at the same time
        // Using "Promise.all" here will give the wrong result in some scenarios
        for (const callback of callbacks)
          await callback(request, model, transaction);

        await newResource.afterUpdate(request, previous, transaction);

        await newResource.recordUpdateEvent(
          previous,
          request.all(),
          transaction,
          Avon.userId(request),
        );

        return newResource;
      });

    request.logger()?.dump(`Updated "${request.resourceName()}" ...`);

    await newResource.updated(request, previous);

    request.logger()?.dump('Preparing response ...');

    return new ResourceUpdateResponse(
      await newResource.serializeForUpdate(request),
    );
  }
}
