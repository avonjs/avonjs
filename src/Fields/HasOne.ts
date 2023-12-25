import AvonRequest from '../Http/Requests/AvonRequest';
import HasManyOrOne from './HasManyOrOne';
import { OpenApiSchema } from '../Contracts';
import FieldCollection from '../Collections/FieldCollection';

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
      properties: new FieldCollection(
        this.schemaFields(request),
      ).responseSchemas(request),
    };
  }
}
