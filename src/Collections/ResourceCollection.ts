import collect from 'collect.js';
import type Resource from '../Resource';
import Collection from './Collection';

export class ResourceCollection extends Collection<Resource> {
  /**
   * Get resource key names.
   */
  keys() {
    return collect<string>(this.map((resource) => resource.uriKey()));
  }
}
