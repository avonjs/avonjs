import type { AnyValue, Model } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import Field from './Field';

export default abstract class Lazy extends Field {
  /**
   * Indicates related resources have to load.
   */
  public loaded = false;

  /**
   * Determine field is resolvable or not.
   */
  public resolvable(): boolean {
    return this.isLoaded();
  }

  /**
   * Specify related resources to load.
   */
  public load(): this {
    this.loaded = true;

    return this;
  }

  /**
   * Determine that related resource loaded.
   */
  public isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Resolve value for given resources.
   */
  abstract resolveForResources(
    request: AvonRequest,
    resources: Model[],
  ): Promise<AnyValue>;
}
