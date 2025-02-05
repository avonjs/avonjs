import type { Action } from '../../Actions';
import { type Model, RequestTypes } from '../../Contracts';
import ActionNotFoundException from '../../Exceptions/ActionNotFoundException';
import MethodNotAllowedException from '../../Exceptions/MethodNotAllowedException';
import ModelNotFoundException from '../../Exceptions/ModelNotFoundException';
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

    MethodNotAllowedException.when(
      action.isDestructive() && !this.isMethod('delete'),
    );
    MethodNotAllowedException.when(
      !action.isDestructive() && this.isMethod('delete'),
    );

    return action;
  }

  /**
   * Get the selected models for the action.
   */
  async models(): Promise<Model[]> {
    const models = await this.repository().whereKeys(this.resourceIds()).all();

    ModelNotFoundException.when(
      models.length === 0 && this.action().isInline(),
    );

    return models;
  }

  /**
   * Get resource IDs from query.
   */
  resourceIds() {
    if (this.action().isInline()) {
      return [this.resourceId()];
    }

    const resourceIds = this.get('resources', []);
    return Array.isArray(resourceIds) ? resourceIds : [resourceIds];
  }
}
