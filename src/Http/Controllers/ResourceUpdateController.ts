import Avon from '../../Avon';
import { Ability } from '../../contracts';
import ResourceUpdateOrUpdateAttachedRequest from '../Requests/ResourceUpdateOrUpdateAttachedRequest';
import { AvonResponse } from '../Responses';
import ResourceUpdateResponse from '../Responses/ResourceUpdateResponse';
import Controller from './Controller';

export default class ResourceUpdateController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceUpdateOrUpdateAttachedRequest,
  ): Promise<AvonResponse> {
    const resource = await request.findResourceOrFail();
    const previous = request.newModel({ ...resource.resource.all() });
    const repository = request.repository();

    await resource.authorizeTo(request, Ability.update);
    await resource.validateForUpdate(request);

    const newResource = await repository.transaction<typeof resource>(
      async () => {
        const [model, callbacks] = request
          .resource()
          .fillForUpdate<typeof resource.resource>(request, resource.resource);

        const newResource = request.newResource(model);

        await newResource.beforeUpdate(request);

        await request.repository().update(model);

        // Attention:
        // Here we have to run the "callbacks" in order
        // To avoid update/insert at the same time
        // Using "Promise.all" here will give the wrong result in some scenarios
        for (const callback of callbacks) await callback(request, model);

        await newResource.afterUpdate(request);

        await newResource.recordUpdateEvent(
          previous,
          request.all(),
          Avon.userId(request),
        );

        return newResource;
      },
    );

    await Promise.all(
      resource
        .detailFields(request, resource.resource)
        .withOnlyRelatableFields()
        .map((field) => field.resolveRelatables(request, [resource.resource])),
    );

    return new ResourceUpdateResponse(
      await newResource.serializeForDetail(request),
    );
  }
}
