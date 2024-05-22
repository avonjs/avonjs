import Avon from '../../Avon';
import { Ability } from '../../Contracts';
import ResourceRestoreRequest from '../Requests/ResourceRestoreRequest';
import { AvonResponse, EmptyResponse } from '../Responses';
import Controller from './Controller';

export default class ResourceRestoreController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceRestoreRequest,
  ): Promise<AvonResponse> {
    const resource = request.newResource(
      await request
        .resource()
        .detailQuery(request, request.findModelQuery())
        .first(),
    );

    await resource.authorizeTo(request, Ability.restore);

    await request
      .repository()
      .transaction<any>(async (repository, transaction) => {
        await resource.beforeRestore(request, transaction);

        await repository.restore(request.route('resourceId') as string);

        await resource.afterRestore(request, transaction);

        await resource.recordRestoreEvent(transaction, Avon.userId(request));
      });

    await resource.restored(request);

    return new EmptyResponse();
  }
}
