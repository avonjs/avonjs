import { NullableCallback } from '../../Contracts';
import FilterableFields from '../../Mixins/FilterableFields';
import { RangeFilter } from '../../Filters';
import Field from '../Field';

export default class NumberFilter extends FilterableFields(RangeFilter) {
  /**
   * Values which will be replaced to null.
   */
  public nullValidator: NullableCallback = (values: {
    min?: number;
    max?: number;
  }) => {
    return values.min === undefined && values.max === undefined;
  };

  constructor(public field: Field) {
    super();
  }

  public parseValue(value: any) {
    return [value?.min ?? null, value?.max ?? null];
  }
}
