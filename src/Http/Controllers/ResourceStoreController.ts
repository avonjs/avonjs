import Avon from '../../Avon';
import { Ability } from '../../contracts';
import ResourceCreateOrAttachRequest from '../Requests/ResourceCreateOrAttachRequest';
import { AvonResponse } from '../Responses';
import ResourceStoreResponse from '../Responses/ResourceStoreResponse';
import Controller from './Controller';

export default class ResourceStoreController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceCreateOrAttachRequest,
  ): Promise<AvonResponse> {
    const resourceClass = request.resource();
    const repository = request.repository();
    const resourceModel = request.model();

    await resourceClass.authorizeTo(request, Ability.create);
    await resourceClass.validateForCreation(request);

    const resource = await repository.transaction<typeof resourceClass>(
      async () => {
        const [model, callbacks] = request
          .resource()
          .fillForCreation<typeof resourceModel>(request, resourceModel);

        const resource = request.newResource(model);

        await resource.beforeCreate(request);

        await request.repository().store(model);

        // Attention:
        // Here we have to run the "callbacks" in order
        // To avoid update/insert at the same time
        // Using "Promise.all" here will give the wrong result in some scenarios
        for (const callback of callbacks) await callback(request, model);

        await resource.afterCreate(request);

        await resource.recordCreationEvent(request.all(), Avon.userId(request));

        return resource;
      },
    );

    await Promise.all(
      resource
        .detailFields(request, resource.resource)
        .onlyLoadedRelatableFields()
        .map((field) => field.resolveRelatables(request, [resource.resource])),
    );

    return new ResourceStoreResponse(
      await resource.serializeForDetail(request),
    );
  }
}
