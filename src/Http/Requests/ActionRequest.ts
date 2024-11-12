import type { Action } from '../../Actions';
import { type Model, RequestTypes } from '../../Contracts';
import ActionNotFoundException from '../../Exceptions/ActionNotFoundException';
import AvonRequest from './AvonRequest';

export default class ActionRequest extends AvonRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ActionRequest;
  }

  /**
   * Get the action instance for the request or abort.
   */
  public action(): Action {
    const action = this.resource()
      .availableActions(this)
      .find((action) => action.uriKey() === this.route('actionName'));

    ActionNotFoundException.unless(action);

    return action;
  }

  /**
   * Get the selected models for the action.
   */
  async models(): Promise<Model[]> {
    const resourceIds = this.get('resources', []);

    return this.repository()
      .whereKeys(Array.isArray(resourceIds) ? resourceIds : [resourceIds])
      .all();
  }
}
