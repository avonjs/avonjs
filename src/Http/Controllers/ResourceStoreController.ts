import Avon from '../../Avon';
import { Ability } from '../../Contracts';
import type ResourceCreateOrAttachRequest from '../Requests/ResourceCreateOrAttachRequest';
import type { AvonResponse } from '../Responses';
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

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.create}" access on "${request.resourceName()}".`,
      );

    await resourceClass.authorizeTo(request, Ability.create);

    request.logger()?.dump('Validating request payload for creation ...');

    await resourceClass.validateForCreation(request);

    request.logger()?.dump(`Storing "${request.resourceName()}" ...`);

    const resource = await request
      .repository()
      .transaction<typeof resourceClass>(async (repository, transaction) => {
        const [data, callbacks] = request
          .resource()
          .fillForCreation<typeof resourceModel>(request, resourceModel);

        const resource = request.newResource(data);

        await resource.beforeCreate(request, transaction);

        const model = await repository.store(data);

        // Attention:
        // Here we have to run the "callbacks" in order
        // To avoid update/insert at the same time
        // Using "Promise.all" here will give the wrong result in some scenarios
        for (const callback of callbacks)
          await callback(request, model, transaction);

        const newResource = request.newResource(model);

        await newResource.afterCreate(request, transaction);

        await newResource.recordCreationEvent(
          request.all(),
          transaction,
          Avon.userId(request),
        );

        return newResource;
      });

    request.logger()?.dump(`Stored new "${request.resourceName()}" ...`);

    await resource.created(request);

    request.logger()?.dump('Preparing response ...');

    return new ResourceStoreResponse(await resource.serializeForStore(request));
  }
}
