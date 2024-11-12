import collect from 'collect.js';
import Joi, { link, type AnySchema } from 'joi';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  AnyValue,
  FilledCallback,
  Model,
  OpenApiSchema,
  Optional,
} from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import Field from './Field';
// TODO: Should be removed or renamed.
// biome-ignore lint/suspicious/noShadowRestrictedNames:
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
   * Minimum length of the array
   */
  protected minItems?: number;

  /**
   * Maximum length of the array
   */
  protected maxItems?: number;

  /**
   * Indicates items schema.
   */
  protected itemsSchema: OpenAPIV3.SchemaObject = {
    type: 'string',
    minItems: 1,
  };

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  protected fillAttributeFromRequest<TModel extends Model>(
    request: AvonRequest,
    requestAttribute: string,
    model: TModel,
    attribute: string,
  ): Optional<FilledCallback> {
    if (!request.exists(requestAttribute)) {
      this.fillAttributeFromDefault(request, model, attribute);

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
   * Specifies the exact number of items in the array.
   */
  public length(limit = 0) {
    this.min(limit).max(limit).rules(Joi.array().length(limit));

    return this;
  }

  /**
   * Specifies the minimum number of items in the array.
   */
  public min(minItems = 0) {
    this.minItems = minItems;
    this.rules(Joi.array().min(minItems));

    return this;
  }

  /**
   * Specifies the maximum number of items in the array.
   */
  public max(maxItems = 0) {
    this.maxItems = maxItems;
    this.rules(Joi.array().max(maxItems));

    return this;
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: AnyValue): AnyValue[] {
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
  public nullValue(): AnyValue {
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
      minItems: this.minItems,
      maxItems: this.maxItems,
    };
  }
}
