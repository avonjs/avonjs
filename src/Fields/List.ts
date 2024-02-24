import Joi from 'joi';
import FieldCollection from '../Collections/FieldCollection';
import AvonRequest from '../Http/Requests/AvonRequest';
import {
  ResolveCallback,
  Rules,
  Model,
  FilledCallback,
  OpenApiSchema,
} from '../Contracts';
import Field from './Field';
import collect from 'collect.js';

export default class List extends Field {
  /**
   * The object possible keys.
   */
  protected fields: FieldCollection;

  constructor(
    attribute: string,
    fields: Field[] = [],
    resolveCallback?: ResolveCallback,
  ) {
    super(attribute, resolveCallback);

    this.fields = new FieldCollection(fields);

    this.default((request) => {
      return [
        new FieldCollection(
          this.fields.each((field) => field.resolveDefaultValue(request)),
        ).fieldValues(request),
      ];
    });
  }

  /**
   * Get the creation rules for this field.
   */
  public getCreationRules(request: AvonRequest): Rules {
    let rules: Rules = {};

    this.fields.each((field) => {
      rules = { ...rules, ...field.getCreationRules(request) };
    });

    return {
      [this.attribute]: Joi.array().items(rules),
    };
  }

  /**
   * Get the update rules for this field.
   */
  public getUpdateRules(request: AvonRequest): Rules {
    let rules: Rules = {};

    this.fields.each((field) => {
      rules = { ...rules, ...field.getUpdateRules(request) };
    });

    return {
      [this.attribute]: Joi.array().items(rules),
    };
  }

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

    const value = request.get(requestAttribute);

    model.setAttribute(
      attribute,
      this.isValidNullValue(value)
        ? this.nullValue()
        : JSON.stringify(collect(value).values().all()),
    );
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): Record<any, any> {
    return typeof value === 'string' ? JSON.parse(value) : value;
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
   * Get the swagger-ui schema.
   */
  protected responseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.responseSchema(request),
      type: 'array',
      items: this.fields.responseSchemas(request),
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.payloadSchema(request),
      type: 'array',
      items: this.fields.payloadSchemas(request),
    };
  }
}
