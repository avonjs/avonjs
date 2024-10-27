import Avon from '../../Avon';
import { Ability } from '../../Contracts';
import type ResourceRestoreRequest from '../Requests/ResourceRestoreRequest';
import { type AvonResponse, EmptyResponse } from '../Responses';
import Controller from './Controller';

export default class ResourceRestoreController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(
    request: ResourceRestoreRequest,
  ): Promise<AvonResponse> {
    request
      .logger()
      ?.dump(`Searching on "${request.resourceName()}" repository ...`);

    const resource = request.newResource(
      await request
        .resource()
        .detailQuery(request, request.findModelQuery())
        .first(),
    );

    request
      .logger()
      ?.dump(
        `Authorizing user for "${Ability.review}" access on "${request.resourceName()}".`,
      );

    await resource.authorizeTo(request, Ability.restore);

    request.logger()?.dump(`Restoring "${request.resourceName()}" ...`);

    await request.repository().transaction(async (repository, transaction) => {
      await resource.beforeRestore(request, transaction);

      await repository.restore(request.route('resourceId') as string);

      await resource.afterRestore(request, transaction);

      await resource.recordRestoreEvent(transaction, Avon.userId(request));
    });

    request.logger()?.dump(`Restored "${request.resourceName()}" ...`);

    await resource.restored(request);

    request.logger()?.dump('Preparing response ...');

    return new EmptyResponse();
  }
}
