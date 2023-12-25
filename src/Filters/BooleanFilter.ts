import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';
import { OpenApiSchema } from '../Contracts';

export default abstract class BooleanFilter extends Filter {
  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'boolean',
      nullable: this.isNullable(),
    };
  }
}
