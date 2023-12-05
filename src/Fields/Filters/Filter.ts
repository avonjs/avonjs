import { Filter } from '../../Filters';
import AvonRequest from '../../Http/Requests/AvonRequest';
import { Repository } from '../../Repositories';
import { Model } from '../../contracts';
import Field from '../Field';

export default abstract class extends Filter {
  /**
   * Indicates if the field is nullable.
   */
  public acceptsNullValues = true;

  constructor(protected field: Field) {
    super();
  }

  /**
   * Apply the filter into the given repository.
   */
  public async apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: any,
  ): Promise<any> {
    if (this.isValidNullValue(value)) {
      return;
    }

    await this.field.applyFilter(request, repository, value);
  }

  /**
   * Get the query parameter key for filter.
   */
  public key(): string {
    return this.field.constructor.name + ':' + this.field.attribute;
  }
}
