import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { Model } from '../Contracts';

import Filter from './Filter';

export default class PrimaryKey extends Filter {
  constructor(...args: readonly []) {
    super(...args);
    this.nullable();
  }

  /**
   * Apply the filter into the given repository.
   */
  public apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: any,
  ): any {
    repository.whereKey(value);
  }
}
