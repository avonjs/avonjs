import collect from 'collect.js';
import Joi, { AnySchema } from 'joi';
import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import { FilledCallback, Model, OpenApiSchema } from '../Contracts';
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
  ): FilledCallback | void {
    if (!request.exists(requestAttribute)) {
      return this.fillAttributeFromDefault(request, model, attribute);
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
   * Specifies the exact number of items in the array.
   */
  public length(limit: number = 0) {
    this.rules(Joi.string().length(limit));

    return this;
  }

  /**
   * Specifies the minimum number of items in the array.
   */
  public min(min: number = 0) {
    this.rules(Joi.array().min(min));

    return this;
  }

  /**
   * Specifies the maximum number of items in the array.
   */
  public max(min: number = 0) {
    this.rules(Joi.array().max(min));

    return this;
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
      ...super.baseSchema(request),
      type: 'array',
      items: this.itemsSchema,
      uniqueItems: true,
    };
  }
}
