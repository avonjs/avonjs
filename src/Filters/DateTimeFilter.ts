import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import Filter from './Filter';
import { Model, OpenApiSchema, Operator } from '../Contracts';
import { Repository } from '../Repositories';

export default abstract class DateTimeFilter extends Filter {
  /**
   * Apply the filter into the given repository.
   */
  public apply(
    request: AvonRequest,
    repository: Repository<Model>,
    dates: Record<string, string>,
  ): any {
    if (typeof dates !== 'object') {
      return;
    }

    if (dates.from !== undefined) {
      repository.where({
        key: this.filterableAttribute(request),
        operator: this.isValidNullValue(dates.from)
          ? Operator.eq
          : Operator.gte,
        value: this.isValidNullValue(dates.from) ? null : dates.from,
      });
    }
    if (dates.to !== undefined) {
      repository.where({
        key: this.filterableAttribute(request),
        operator: this.isValidNullValue(dates.to) ? Operator.eq : Operator.lte,
        value: this.isValidNullValue(dates.to) ? null : dates.to,
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
        name: `filters[${this.key()}][from]`,
        in: 'query',
        explode: true,
        style: 'deepObject',
        description: this.helpText,
        allowEmptyValue: this.isNullable(),
        schema: this.schema(request),
      },
      {
        name: `filters[${this.key()}][to]`,
        in: 'query',
        explode: true,
        style: 'deepObject',
        description: this.helpText,
        allowEmptyValue: this.isNullable(),
        schema: this.schema(request),
      },
    ];
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'string',
      nullable: this.isNullable(),
      format: 'date-time',
    };
  }
}
