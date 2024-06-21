import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import QueryParameter from '../Http/Requests/QueryParameter';
import AuthorizedToSee from '../Mixins/AuthorizedToSee';
import {
  ParameterSerializable,
  HasSchema,
  SeeCallback,
  Model,
  OpenApiSchema,
} from '../Contracts';
import { Repository } from '../Repositories';

export default abstract class Filter
  extends AuthorizedToSee(QueryParameter)
  implements ParameterSerializable, HasSchema
{
  /**
   * The help text for the field.
   */
  public helpText?: string;

  /**
   * Get the query parameter key for filter.
   */
  public key(): string {
    return this.constructor.name;
  }

  /**
   * Specify the field help text.
   */
  public help(helpText: string): this {
    this.helpText = helpText;

    return this;
  }

  /**
   * Apply the filter into the given repository.
   */
  public abstract apply(
    request: AvonRequest,
    repository: Repository<Model>,
    value: any,
  ): any;

  /**
   * Serialize parameters for schema.
   */
  public serializeParameters(
    request: AvonRequest,
  ): OpenAPIV3.ParameterObject[] {
    return [
      {
        name: `filters[${this.key()}]`,
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
    };
  }

  public canSee(callback: SeeCallback): this {
    return super.canSee(callback);
  }
}
