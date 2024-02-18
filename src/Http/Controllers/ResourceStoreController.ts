import Avon from '../../Avon';
import { Ability } from '../../Contracts';
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
    const resourceModel = request.model();

    await resourceClass.authorizeTo(request, Ability.create);
    await resourceClass.validateForCreation(request);

    const resource = await request
      .repository()
      .transaction<typeof resourceClass>(async (repository, transaction) => {
        const [data, callbacks] = request
          .resource()
          .fillForCreation<typeof resourceModel>(request, resourceModel);

        const resource = request.newResource(data);

        await resource.beforeCreate(request);

        const model = await repository.store(data);

        // Attention:
        // Here we have to run the "callbacks" in order
        // To avoid update/insert at the same time
        // Using "Promise.all" here will give the wrong result in some scenarios
        for (const callback of callbacks)
          await callback(request, model, transaction);

        const newResource = request.newResource(model);

        await newResource.afterCreate(request);

        await newResource.recordCreationEvent(
          request.all(),
          Avon.userId(request),
        );

        return newResource;
      });

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
