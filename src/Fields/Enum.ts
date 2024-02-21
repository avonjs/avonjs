import AvonRequest from '../Http/Requests/AvonRequest';
import { EnumValues, OpenApiSchema, ResolveCallback } from '../Contracts';
import Text from './Text';
import Joi from 'joi';
import EnumFilter from './Filters/EnumFilter';
import { Filter } from '../Filters';

export default class Enum extends Text {
  /**
   * Indicates enum values.
   */
  protected values: EnumValues;

  constructor(
    attribute: string,
    values: EnumValues,
    resolveCallback?: ResolveCallback,
  ) {
    super(attribute, resolveCallback);
    this.values = values;
    this.rulesSchema = Joi.string().valid(...values);
    this.creationRulesSchema = Joi.string().valid(...values);
    this.updateRulesSchema = Joi.string().valid(...values);
  }

  /**
   * Get the enum values.
   */
  public getValues(): EnumValues {
    return this.values;
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new EnumFilter(this);
  }

  /**
   * Get the base swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      enum: this.values,
    };
  }
}
