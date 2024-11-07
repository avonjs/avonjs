import Joi from 'joi';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';

import type {
  AnyValue,
  DefaultCallback,
  OpenApiSchema,
  Optional,
} from '../Contracts';
import Field from './Field';
import NumberFilter from './Filters/NumberFilter';
import ResourceIdFilter from './Filters/ResourceIdFilter';

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
   * Indicates a minimum acceptable value.
   */
  protected minimum?: number;

  /**
   * Indicates a maximum acceptable value.
   */
  protected maximum?: number;

  /**
   * Indicates whether the range filter is disabled or not.
   */
  protected disableRangeFilter = true;

  /**
   * Specifies the minimum value.
   */
  public min(minimum = 0) {
    this.minimum = minimum;
    this.rules(Joi.number().min(minimum));

    return this;
  }

  /**
   * Specifies the maximum value.
   */
  public max(maximum = 0) {
    this.maximum = maximum;
    this.rules(Joi.number().max(maximum));

    return this;
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(
    request: AvonRequest,
    value: AnyValue,
  ): Optional<number> {
    return Number.parseInt(value);
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
   * Prevent filters by range of values and force to accept only array of values.
   */
  public preventRangeFilter(disableRangeFilter = true) {
    this.disableRangeFilter = disableRangeFilter;

    return this;
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return this.disableRangeFilter
      ? new ResourceIdFilter(this)
      : new NumberFilter(this);
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'integer',
      minimum: this.minimum,
      maximum: this.maximum,
    };
  }
}
