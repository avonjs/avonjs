import { Select } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import Enum from '../Enum';

export default class EnumFilter extends FilterableFields(Select) {
  constructor(public field: Enum) {
    super();
  }

  /**
   * Get the possible filtering values.
   */
  public options(): any[] {
    return this.field.getValues();
  }
}
