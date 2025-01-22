import Joi from 'joi';
import { DateTime as Formatter } from 'luxon';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';

import type { AnyValue, ResolveCallback } from '../Contracts';
import Field from './Field';
import DateTimeFilter from './Filters/DateTimeFilter';

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
  protected dateFormat = 'yyyy-mm-dd HH:mm:ss';

  constructor(attribute: string, resolveCallback?: ResolveCallback) {
    super(attribute, resolveCallback);

    this.default(() => {
      return this.isNullable()
        ? this.nullValue()
        : Formatter.now().toFormat(this.dateFormat);
    });
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: AnyValue): string {
    return Formatter.fromJSDate(new Date(value)).toFormat(this.dateFormat);
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
    return new DateTimeFilter(this);
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
