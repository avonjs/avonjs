import type { AbstractMixable, SeeCallback } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class AuthorizedToSee extends Parent {
    /**
     * The callback used to authorize viewing the filter or action.
     */
    public seeCallback: SeeCallback = () => true;

    /**
     * Determine if the filter or action should be available for the given request.
     */
    public authorizedToSee(request: AvonRequest): boolean {
      return this.seeCallback(request);
    }

    /**
     * Set the callback to be run to authorize viewing the filter or action.
     */
    public canSee(callback: SeeCallback) {
      this.seeCallback = callback;

      return this as unknown as this;
    }
  }

  return AuthorizedToSee;
};
