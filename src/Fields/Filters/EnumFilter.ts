import { OpenApiSchema } from '../../Contracts';
import { Filter } from '../../Filters';
import AvonRequest from '../../Http/Requests/AvonRequest';
import FilterableFields from '../../Mixins/FilterableFields';
import Enum from '../Enum';

export default class TextFilter extends FilterableFields(Filter) {
  constructor(public field: Enum) {
    super();
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.schema(request),
      enum: this.field.getValues(),
    };
  }
}
