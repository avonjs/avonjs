import { Action } from '../Actions';
import AvonRequest from '../Http/Requests/AvonRequest';
import { AbstractMixable } from '../contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class ResolvesActions extends Parent {
    /**
     * Get the actions that are available for the given request.
     */
    public availableActions(request: AvonRequest): Action[] {
      return this.resolveActions(request).filter((action) => {
        return action.authorizedToSee(request);
      });
    }

    /**
     * Get the actions for the given request.
     */
    public resolveActions(request: AvonRequest): Action[] {
      return this.actions(request);
    }

    /**
     * Get the actions available on the entity.
     */
    public actions(request: AvonRequest): Action[] {
      return [
        //
      ];
    }
  }

  return ResolvesActions;
};
