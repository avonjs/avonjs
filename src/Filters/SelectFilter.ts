import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';
import { OpenApiSchema } from '../contracts';

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
  schema(request: AvonRequest): OpenApiSchema {
    return {
      oneOf: [{ type: 'string' }, { type: 'number' }],
      enum: this.options(),
      nullable: this.isNullable(),
    };
  }
}
