import FieldCollection from '../Collections/FieldCollection';
import type { AnyValue, OpenApiSchema } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import HasManyOrOne from './HasManyOrOne';

export default class HasOne extends HasManyOrOne {
  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: AnyValue): AnyValue {
    return super.getMutatedValue(request, value)[0];
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'object',
      properties: new FieldCollection(
        this.schemaFields(request),
      ).responseSchemas(request),
    };
  }
}
