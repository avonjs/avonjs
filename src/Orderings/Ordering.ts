import type { OpenAPIV3 } from 'openapi-types';
import {
  type AnyValue,
  Direction,
  type HasSchema,
  type Model,
  type OpenApiSchema,
  type ParameterSerializable,
  type SeeCallback,
} from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import QueryParameter from '../Http/Requests/QueryParameter';
import AuthorizedToSee from '../Mixins/AuthorizedToSee';
import type { Repository } from '../Repositories';

export default abstract class Ordering
  extends AuthorizedToSee(QueryParameter)
  implements ParameterSerializable, HasSchema
{
  /**
   * Get the query parameter key for filter.
   */
  public key(): string {
    return this.constructor.name;
  }

  /**
   * Apply the filter into the given repository.
   */
  public abstract apply(
    request: AvonRequest,
    repository: Repository<Model>,
    direction: Direction,
  ): AnyValue;

  /**
   * Serialize parameters for schema.
   */
  public serializeParameters(
    request: AvonRequest,
  ): OpenAPIV3.ParameterObject[] {
    return [
      {
        name: `orders[${this.key()}]`,
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
      type: 'string',
      nullable: this.isNullable(),
      enum: [Direction.ASC, Direction.DESC],
    };
  }

  public canSee(callback: SeeCallback): this {
    return super.canSee(callback);
  }
}
