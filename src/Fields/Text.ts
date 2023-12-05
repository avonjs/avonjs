import Joi from 'joi';
import { OpenAPIV3 } from 'openapi-types';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';

import {
  DefaultCallback,
  FilterableCallback,
  Model,
  Operator,
} from '../contracts';
import Field from './Field';
import TextFilter from './Filters/TextFilter';
import { Repository } from '../Repositories';

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
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): string | null {
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
        operator: Operator.like,
        value,
      });
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(
    request: AvonRequest,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
    return {
      ...super.schema(request),
      type: 'string',
    };
  }
}
