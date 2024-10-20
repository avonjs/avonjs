import type { AnyArray } from '../../Contracts';
import { Select } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import type Enum from '../Enum';

export default class EnumFilter extends FilterableFields(Select) {
  constructor(public field: Enum) {
    super();
  }

  /**
   * Get the possible filtering values.
   */
  public options(): AnyArray {
    return this.field.getValues();
  }
}
