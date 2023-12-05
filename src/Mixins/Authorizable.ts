import { ForbiddenException } from '../Exceptions';
import AvonRequest from '../Http/Requests/AvonRequest';
import { AbstractMixable, Ability, Model } from '../contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Authorizable extends Parent {
    /**
     * Determine if the current user has a given ability or throw exception.
     * @throws {ForbiddenException}
     */
    public async authorizeTo(
      request: AvonRequest,
      ability: Ability,
      args: any[] = [],
    ): Promise<void> {
      ForbiddenException.unless(
        await this.authorizedTo(request, ability, args),
      );
    }

    /**
     * Determine if the current user has a given ability.
     */
    public async authorizedTo(
      request: AvonRequest,
      ability: Ability,
      args: any[] = [],
    ): Promise<boolean> {
      const authorizationCallback =
        this[this.makeAuthorizationCallback(ability) as keyof this];

      return this.authorizable() && typeof authorizationCallback === 'function'
        ? authorizationCallback.apply(this, [request, ...args])
        : Promise.resolve(true);
    }

    /**
     * Determine if need to perform authorization.
     */
    public authorizable(): boolean {
      return true;
    }

    /**
     * Guess custom authorization callback name for the given ability.
     */
    public makeAuthorizationCallback(ability: string): string {
      return `authorizedTo${ability[0].toUpperCase()}${ability.substring(1)}`;
    }

    /**
     * Determine if the current user has ability to `viewAny` a resource.
     */
    public async authorizedToViewAny(request: AvonRequest): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `view` a resource.
     */
    public async authorizedToView(request: AvonRequest): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `create` a resource.
     */
    public async authorizedToCreate(request: AvonRequest): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `update` a resource.
     */
    public async authorizedToUpdate(request: AvonRequest): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `delete` a resource.
     */
    public async authorizedToDelete(request: AvonRequest): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `forceDelete` a resource.
     */
    public async authorizedToForceDelete(
      request: AvonRequest,
    ): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `restore` a resource.
     */
    public async authorizedToRestore(request: AvonRequest): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `add` a resource to the current resource.
     */
    public async authorizedToAdd(
      request: AvonRequest,
      resource: Model,
    ): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `attach` a resource to the current resource.
     */
    public async authorizedToAttach(
      request: AvonRequest,
      resource: Model,
    ): Promise<boolean> {
      return true;
    }

    /**
     * Determine if the current user has ability to `detach` a resource from the current resource.
     */
    public async authorizedToDetach(
      request: AvonRequest,
      resource: Model,
    ): Promise<boolean> {
      return true;
    }
  }

  return Authorizable;
};
