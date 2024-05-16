import Joi from 'joi';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';

import { DefaultCallback, OpenApiSchema } from '../Contracts';
import Field from './Field';
import NumberFilter from './Filters/NumberFilter';

export default class Integer extends Field {
  /**
   * The callback to be used for the field's default value.
   */
  public defaultCallback: DefaultCallback = () => {
    return this.isNullable() ? this.nullValue() : 0;
  };

  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema = Joi.number().integer();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema = Joi.number().integer();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema = Joi.number().integer();

  /**
   * Specifies the minimum value.
   */
  public min(min: number = 0) {
    this.rules(Joi.number().min(min));

    return this;
  }

  /**
   * Specifies the maximum value.
   */
  public max(min: number = 0) {
    this.rules(Joi.number().max(min));

    return this;
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): number | undefined {
    return parseInt(value);
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
    return new NumberFilter(this);
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'integer',
    };
  }
}
