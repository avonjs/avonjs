import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';

export default abstract class SelectFilter extends Filter {
  /**
   * Get the possible filtering values.
   */
  public options(): any[] {
    return [];
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(
    request: AvonRequest,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
    return {
      oneOf: [{ type: 'string' }, { type: 'number' }],
      enum: this.options(),
      nullable: this.isNullable(),
    };
  }
}
