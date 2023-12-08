import collect from 'collect.js';
import Joi, { AnySchema } from 'joi';
import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import { FilledCallback, Model, OpenApiSchema } from '../contracts';
import Field from './Field';

export default class Array extends Field {
  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema: AnySchema = Joi.array().items(Joi.any());

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema: AnySchema = Joi.array().items(Joi.any());

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema: AnySchema = Joi.array().items(Joi.any());

  /**
   * Indicates items schema.
   */
  protected itemsSchema: OpenAPIV3.SchemaObject = {
    type: 'string',
    minLength: 1,
  };

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  protected fillAttributeFromRequest<TModel extends Model>(
    request: AvonRequest,
    requestAttribute: string,
    model: TModel,
    attribute: string,
  ): FilledCallback | undefined {
    if (!request.exists(requestAttribute)) {
      return;
    }

    const value = request.array(requestAttribute);

    model.setAttribute(
      attribute,
      this.isValidNullValue(value)
        ? this.nullValue()
        : collect(value).values().all(),
    );
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): any[] {
    return collect(value).values().all();
  }

  /**
   * Determine field is filterable or not.
   */
  public isFilterable(): boolean {
    return false;
  }

  /**
   * Determine field is orderable or not.
   */
  public isOrderable(): boolean {
    return false;
  }

  /**
   * Specify items schema.
   */
  public items(itemsSchema: OpenAPIV3.SchemaObject): this {
    this.itemsSchema = itemsSchema;

    return this;
  }

  /**
   * Get the value considered as null.
   */
  public nullValue(): any {
    return [];
  }

  /**
   * Get the base swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.schema(request),
      type: 'array',
      items: this.itemsSchema,
      uniqueItems: true,
    };
  }
}
