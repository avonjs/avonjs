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
    const repository = request.repository();
    const model = await request.findModelOrFail();

    await resource.authorizeTo(request, Ability.delete);

    await repository.transaction<any>(async () => {
      // handle prunable fields
      // await Promise.all(
      //   resource
      //     .prunableFields(request, false)
      //     .map((field) => field.forRequest(request)),
      // );

      await resource.beforeDelete(request);

      await request.repository().delete(model.getKey());

      await resource.afterDelete(request);

      if (resource.softDeletes()) {
        await resource.recordDeletionEvent(Avon.userId(request));
      } else {
        await resource.flushActionEvents();
      }
    });

    return new EmptyResponse();
  }
}
