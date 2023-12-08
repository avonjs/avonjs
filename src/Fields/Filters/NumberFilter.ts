import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../../Http/Requests/AvonRequest';
import { Repository } from '../../Repositories';
import { Model, OpenApiSchema } from '../../contracts';
import Filter from './Filter';

export default class NumberFilter extends Filter {
  /**
   * Apply the filter into the given repository.
   */
  public async apply(
    request: AvonRequest,
    repository: Repository<Model>,
    values: { min?: number; max?: number },
  ): Promise<any> {
    if (values.min !== undefined || values.max !== undefined) {
      await this.field.applyFilter(request, repository, [
        values.min ?? null,
        values.max ?? null,
      ]);
    }
  }

  /**
   * Serialize parameters for schema.
   */
  public serializeParameters(
    request: AvonRequest,
  ): OpenAPIV3.ParameterObject[] {
    return [
      {
        name: `filters[${this.key()}][min]`,
        in: 'query',
        explode: true,
        style: 'deepObject',
        schema: this.schema(request),
      },
      {
        name: `filters[${this.key()}][max]`,
        in: 'query',
        explode: true,
        style: 'deepObject',
        schema: this.schema(request),
      },
    ];
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'number',
      nullable: this.isNullable(),
    };
  }
}
