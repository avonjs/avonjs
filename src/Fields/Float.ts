import Joi from 'joi';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';

import {
  DefaultCallback,
  FilterableCallback,
  Model,
  OpenApiSchema,
  Operator,
} from '../Contracts';
import Field from './Field';
import NumberFilter from './Filters/NumberFilter';
import { Repository } from '../Repositories';

export default class Float extends Field {
  /**
   * The callback to be used for the field's default value.
   */
  public defaultCallback: DefaultCallback = () => {
    return this.isNullable() ? this.nullValue() : 0;
  };

  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema = Joi.number().precision(2);

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema = Joi.number().precision(2);

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema = Joi.number().precision(2);

  /**
   * The maximum number of decimal places allowed.
   */
  protected decimal: number = 2;

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): number | undefined {
    return Number(parseFloat(value).toFixed(this.decimal));
  }

  /**
   * Specifies the maximum number of decimal places.
   */
  public precision(decimal: number): this {
    this.decimal = decimal;

    this.rules(Joi.number().precision(decimal));

    return this;
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
   * Define the default filterable callback.
   */
  public defaultFilterableCallback(): FilterableCallback {
    return (
      request: AvonRequest,
      repository: Repository<Model>,
      values: number[],
    ) => {
      if (values[0] !== null) {
        repository.where({
          key: this.filterableAttribute(request),
          operator: Operator.gte,
          value: values[0],
        });
      }

      if (values[1] !== null) {
        repository.where({
          key: this.filterableAttribute(request),
          operator: Operator.lte,
          value: values[1],
        });
      }
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'number',
      format: 'float',
    };
  }
}
