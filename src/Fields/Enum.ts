import AvonRequest from '../Http/Requests/AvonRequest';
import {
  DefaultCallback,
  EnumValues,
  FilterableCallback,
  Model,
  OpenApiSchema,
  Operator,
  ResolveCallback,
} from '../Contracts';
import Text from './Text';
import Joi from 'joi';
import EnumFilter from './Filters/EnumFilter';
import { Filter } from '../Filters';
import { Repository } from '../Repositories';
import Field from './Field';

export default class Enum extends Field {
  /**
   * Indicates enum values.
   */
  protected values: EnumValues;

  /**
   * The callback to be used for the field's default value.
   */
  public defaultCallback: DefaultCallback = () => {
    return this.isNullable() ? this.nullValue() : this.values[0];
  };

  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema = Joi.string();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema = Joi.string();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema = Joi.string();

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
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): string | null {
    return this.values.includes(value) ? value : this.nullValue();
  }

  /**
   * Determine field is filterable or not.
   */
  public isFilterable(): boolean {
    return true;
  }

  /**
   * Determine field is orderable or not.
   */
  public isOrderable(): boolean {
    return true;
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
