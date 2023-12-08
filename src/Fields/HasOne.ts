import collect from 'collect.js';
import AvonRequest from '../Http/Requests/AvonRequest';
import Field from './Field';
import HasManyOrOne from './HasManyOrOne';
import { OpenApiSchema } from '../contracts';

export default class HasOne extends HasManyOrOne {
  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): any {
    return super.getMutatedValue(request, value)[0];
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'object',
      properties: collect(this.relatableFields(request)).mapWithKeys(
        (field: Field) => [field.attribute, field.schema(request)],
      ) as Record<string, OpenApiSchema>,
    };
  }
}
