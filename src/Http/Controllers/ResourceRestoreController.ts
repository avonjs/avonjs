import Avon from '../../Avon';
import { Ability } from '../../contracts';
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
    const repository = request.repository();
    const resource = request.newResource(
      await request
        .resource()
        .detailQuery(request, request.findModelQuery())
        .first(),
    );

    await resource.authorizeTo(request, Ability.restore);

    await repository.transaction<any>(async () => {
      await resource.beforeRestore(request);

      await request.repository().restore(request.route('resourceId') as string);

      await resource.afterRestore(request);

      await resource.recordRestoreEvent(Avon.userId(request));
    });

    return new EmptyResponse();
  }
}
