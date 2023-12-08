import Joi from 'joi';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';

import {
  DefaultCallback,
  FilterableCallback,
  Model,
  OpenApiSchema,
  Operator,
} from '../contracts';
import Field from './Field';
import { Repository } from '../Repositories';
import BinaryFilter from './Filters/BinaryFilter';

export default class Binary extends Field {
  /**
   * The callback to be used for the field's default value.
   */
  public defaultCallback: DefaultCallback = () => {
    return this.isNullable() ? this.nullValue() : false;
  };

  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema = Joi.boolean();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema = Joi.boolean();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema = Joi.boolean();

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): boolean {
    return Boolean(value);
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
    return new BinaryFilter(this);
  }

  /**
   * Define the default filterable callback.
   */
  public defaultFilterableCallback(): FilterableCallback {
    return (
      request: AvonRequest,
      repository: Repository<Model>,
      value: any,
    ) => {
      repository.where({
        key: this.filterableAttribute(request),
        operator: Operator.eq,
        value: Boolean(value),
      });
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      type: 'boolean',
    };
  }
}
