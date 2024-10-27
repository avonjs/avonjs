import Avon from '../../Avon';
import { Ability } from '../../Contracts';
import type ResourceDeleteRequest from '../Requests/ResourceDeleteRequest';
import { type AvonResponse, EmptyResponse } from '../Responses';
import Controller from './Controller';

export default class ResourceDeleteController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ResourceDeleteRequest): Promise<AvonResponse> {
    request
      .logger()
      ?.dump(`Searching on "${request.resourceName()}" repository ...`);

    const resource = await request.findResourceOrFail();
    const model = await request.findModelOrFail();

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.delete}" access on "${request.resourceName()}".`,
      );

    await resource.authorizeTo(request, Ability.delete);

    if (resource.softDeletes()) {
      request.logger()?.dump(`Soft deleting "${request.resourceName()}" ...`);
    } else {
      request.logger()?.dump(`Deleting "${request.resourceName()}" ...`);
    }

    await request.repository().transaction(async (repository, transaction) => {
      // handle prunable fields
      // await Promise.all(
      //   resource
      //     .prunableFields(request, false)
      //     .map((field) => field.forRequest(request)),
      // );

      await resource.beforeDelete(request, transaction);

      await repository.delete(model.getKey());

      await resource.afterDelete(request, transaction);

      if (resource.softDeletes()) {
        await resource.recordDeletionEvent(transaction, Avon.userId(request));
      } else {
        await resource.flushActionEvents(transaction);
      }
    });

    if (!resource.softDeletes()) {
      request
        .logger()
        ?.dump(
          `Resource "${request.resourceName()}" by id "${request.resourceId()}" "deleted".`,
        );

      await resource.deleted(request);
    } else {
      request
        .logger()
        ?.dump(`Resource "${request.resourceName()}" "soft deleted".`);
    }

    request.logger()?.dump('Preparing response ...');

    return new EmptyResponse();
  }
}
