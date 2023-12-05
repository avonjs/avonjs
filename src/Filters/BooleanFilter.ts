import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';

export default abstract class BooleanFilter extends Filter {
  /**
   * Get the swagger-ui schema.
   */
  schema(
    request: AvonRequest,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
    return {
      type: 'boolean',
      nullable: this.isNullable(),
    };
  }
}
