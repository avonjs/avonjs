import type ActionRequest from '../Requests/ActionRequest';
import type AvonResponse from '../Responses/AvonResponse';
import Controller from './Controller';

export default class ActionStoreController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: ActionRequest): Promise<AvonResponse> {
    const action = request.action();
    // validate required fields
    await action.validate(request);
    // run action
    return action.handleRequest(request);
  }
}
