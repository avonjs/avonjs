import Avon from '../../Avon';
import { Ability } from '../../Contracts';
import ResourceDeleteRequest from '../Requests/ResourceDeleteRequest';
import { AvonResponse, EmptyResponse } from '../Responses';
import Controller from './Controller';

export default class ResourceDeleteController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ResourceDeleteRequest): Promise<AvonResponse> {
    const resource = await request.findResourceOrFail();
    const model = await request.findModelOrFail();

    await resource.authorizeTo(request, Ability.delete);

    await request
      .repository()
      .transaction<any>(async (repository, transaction) => {
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
      await resource.deleted(request);
    }

    return new EmptyResponse();
  }
}
