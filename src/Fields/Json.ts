import Joi, { ObjectSchema } from 'joi';
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

export default class Json extends Field {
  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema: ObjectSchema = Joi.object();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema: ObjectSchema = Joi.object();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema: ObjectSchema = Joi.object();

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
      return new FieldCollection(
        this.fields.each((field) => field.resolveDefaultValue(request)),
      ).fieldValues(request);
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
      [this.attribute]: (
        super.getCreationRules(request)[this.attribute] as ObjectSchema
      ).keys(rules),
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
      [this.attribute]: (
        super.getUpdateRules(request)[this.attribute] as ObjectSchema
      ).keys(rules),
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
  protected responseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.responseSchema(request),
      type: 'object',
      properties: this.fields.responseSchemas(request),
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.payloadSchema(request),
      type: 'object',
      properties: this.fields.payloadSchemas(request),
    };
  }
}
