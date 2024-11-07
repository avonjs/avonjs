import Joi from 'joi';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';

import type { AnyValue, DefaultCallback, OpenApiSchema } from '../Contracts';
import Field from './Field';
import TextFilter from './Filters/TextFilter';

export default class Text extends Field {
  /**
   * The callback to be used for the field's default value.
   */
  public defaultCallback: DefaultCallback = () => {
    return this.isNullable() ? this.nullValue() : '';
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

  /**
   * Indicates a minimum acceptable value.
   */
  protected minimum?: number;

  /**
   * Indicates a maximum acceptable value.
   */
  protected maximum?: number;

  /**
   * Specifies the minimum number of string characters.
   */
  public min(minimum = 0) {
    this.minimum = minimum;
    this.rules(Joi.string().min(minimum));

    return this;
  }

  /**
   * Specifies the maximum number of string characters.
   */
  public max(maximum = 0) {
    this.maximum = maximum;
    this.rules(Joi.string().max(maximum));

    return this;
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: AnyValue): string | null {
    return String(value);
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
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new TextFilter(this);
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      minimum: this.minimum,
      maximum: this.maximum,
    };
  }
}
