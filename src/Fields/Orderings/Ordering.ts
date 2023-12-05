import AvonRequest from '../../Http/Requests/AvonRequest';
import { Ordering } from '../../Orderings';
import { Repository } from '../../Repositories';
import { Model } from '../../contracts';
import Field from '../Field';

export default class extends Ordering {
  /**
   * Indicates if the field is nullable.
   */
  public acceptsNullValues = true;

  constructor(protected field: Field) {
    super();
  }

  /**
   * Apply the ordering into the given repository.
   */
  public async apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: any,
  ): Promise<any> {
    if (this.isValidNullValue(value)) {
      return;
    }

    this.field.applyOrdering(request, repository, value);
  }

  /**
   * Get the query parameter key for ordering.
   */
  public key(): string {
    return this.field.constructor.name + ':' + this.field.attribute;
  }
}
