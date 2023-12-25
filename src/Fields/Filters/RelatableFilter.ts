import collect from 'collect.js';
import { NullableCallback, OpenApiSchema } from '../../Contracts';
import FilterableFields from '../../Mixins/FilterableFields';
import { Filter } from '../../Filters';
import AvonRequest from '../../Http/Requests/AvonRequest';
import Relation from '../Relation';

export default class RelatableFilter extends FilterableFields(Filter) {
  constructor(public field: Relation) {
    super();
  }
  /**
   * Values which will be replaced to null.
   */
  public nullValidator: NullableCallback = (value: any) => {
    return this.parseValue(value).length === 0;
  };

  public parseValue(value: any) {
    return collect<number | string>(value)
      .filter((value) => value !== undefined && String(value).length > 0)
      .all();
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'array',
      items: { oneOf: [{ type: 'number' }, { type: 'string' }] },
      nullable: this.isNullable(),
    };
  }
}
