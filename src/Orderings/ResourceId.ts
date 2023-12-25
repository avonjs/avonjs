import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';

import { Direction, Model } from '../Contracts';
import Ordering from './Ordering';

export default class PrimaryKey extends Ordering {
  /**
   * Apply the filter into the given repository.
   */
  public apply(
    request: AvonRequest,
    repository: Repository<Model>,
    direction: Direction,
  ): any {
    return repository.order({
      key: request.model().getKeyName(),
      direction: Direction.ASC === direction ? direction : Direction.DESC,
    });
  }
}
