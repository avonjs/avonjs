import FilterableFields from '../../Mixins/FilterableFields';
import { RangeFilter } from '../../Filters';
import Field from '../Field';

export default class NumberFilter extends FilterableFields(RangeFilter) {
  constructor(public field: Field) {
    super();
  }
}
