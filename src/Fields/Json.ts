import Joi from 'joi';
import { OpenAPIV3 } from 'openapi-types';
import FieldCollection from '../Collections/FieldCollection';
import AvonRequest from '../Http/Requests/AvonRequest';
import {
  ResolveCallback,
  Rules,
  Model,
  FilledCallback,
  OpenApiSchema,
} from '../contracts';
import Field from './Field';

export default class Json extends Field {
  /**
   * The object possible keys.
   */
  protected fields: FieldCollection;

  constructor(
    attribute: string,
    fields: Field[],
    resolveCallback?: ResolveCallback,
  ) {
    super(attribute, resolveCallback);

    this.fields = new FieldCollection(fields);

    this.default((request) => {
      return this.fields
        .mapWithKeys((field: Field) => {
          field.resolveDefaultValue(request);

          return [field.attribute, field.getValue(request)];
        })
        .all() as Record<string, any>;
    });
  }

  /**
   * Get the validation rules for this field.
   */
  public getRules(request: AvonRequest): Rules {
    let rules: Rules = {};

    this.fields.each((field) => {
      rules = { ...rules, ...field.getRules(request) };
    });

    return {
      [this.attribute]: Joi.object(rules),
    };
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
      [this.attribute]: Joi.object(rules),
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
      [this.attribute]: Joi.object(rules),
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
      this.isValidNullValue(value) ? this.nullValue() : JSON.stringify(value),
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
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'object',
      properties: this.fields.mapWithKeys((field: Field) => [
        field.attribute,
        field.schema(request),
      ]) as Record<string, any>,
    };
  }
}
