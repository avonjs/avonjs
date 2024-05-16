import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';
import { Model, OpenApiSchema, Operator } from '../Contracts';
import { Repository } from '../Repositories';

export default abstract class RangeFilter extends Filter {
  /**
   * Apply the filter into the given repository.
   */
  public apply(
    request: AvonRequest,
    repository: Repository<Model>,
    range: Record<string, string>,
  ): any {
    if (typeof range !== 'object') {
      return;
    }

    if (range.min !== undefined) {
      repository.where({
        key: this.filterableAttribute(request),
        operator: Operator.gte,
        value: Number(range.min),
      });
    }

    if (range.max !== undefined) {
      repository.where({
        key: this.filterableAttribute(request),
        operator: Operator.lte,
        value: Number(range.max),
      });
    }
  }

  /**
   * Get the attribute that the date filter should perform on it.
   */
  abstract filterableAttribute(request: AvonRequest): string;

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
