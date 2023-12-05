import collect from 'collect.js';
import AvonRequest from '../../Http/Requests/AvonRequest';
import { Repository } from '../../Repositories';
import { NullableCallback, Model } from '../../contracts';
import Filter from './Filter';

export default class RelatableFilter extends Filter {
  /**
   * Values which will be replaced to null.
   */
  public nullValidator: NullableCallback = (value: any) => {
    return collect<number | string>(value)
      .filter((value) => value !== undefined && String(value).length > 0)
      .isEmpty();
  };

  /**
   * Apply the filter into the given repository.
   */
  public async apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: any,
  ): Promise<any> {
    return await super.apply(request, repository, collect(value).all());
  }

  /**
   * Get the query parameter key for filter.
   */
  public key(): string {
    return this.field.constructor.name + ':' + this.field.attribute;
  }
}
