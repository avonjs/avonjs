import { NullableCallback } from '../../Contracts';
import FilterableFields from '../../Mixins/FilterableFields';
import { DateTime } from '../../Filters';
import Field from '../Field';

export default class DateTimeFilter extends FilterableFields(DateTime) {
  /**
   * Values which will be replaced to null.
   */
  public nullValidator: NullableCallback = (values: {
    from?: string;
    to?: string;
  }) => {
    return values.from === undefined && values.to === undefined;
  };

  constructor(public field: Field) {
    super();
  }
}
