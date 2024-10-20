import type ActionRequest from '../Requests/ActionRequest';
import type { AvonResponse } from '../Responses';
import ActionIndexResponse from '../Responses/ActionIndexResponse';
import Controller from './Controller';

export default class ActionIndexController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ActionRequest): Promise<AvonResponse> {
    const resource = request.resource();

    return new ActionIndexResponse(
      resource
        .availableActions(request)
        .map((action) => action.serializeForIndex(request)),
    );
  }
}
