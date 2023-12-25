import Joi from 'joi';
import moment from 'moment';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';

import {
  ResolveCallback,
  FilterableCallback,
  Model,
  Operator,
} from '../Contracts';
import Field from './Field';
import TextFilter from './Filters/TextFilter';
import { Repository } from '../Repositories';

export default class DateTime extends Field {
  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema = Joi.date();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema = Joi.date();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema = Joi.date();

  /**
   * Indicates the date store / retrieve format.
   */
  protected dateFormat: string = 'YYYY-MM-DD HH:mm:ss';

  constructor(attribute: string, resolveCallback?: ResolveCallback) {
    super(attribute, resolveCallback);

    this.default(() => {
      return this.isNullable()
        ? this.nullValue()
        : moment().format(this.dateFormat);
    });
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): string {
    return moment(value).format(this.dateFormat);
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
        operator: Operator.eq,
        value: Boolean(value),
      });
    };
  }

  /**
   *
   * Specify store / retrieve date format.
   */
  public format(dateFormat: string): this {
    this.dateFormat = dateFormat;

    return this;
  }
}
