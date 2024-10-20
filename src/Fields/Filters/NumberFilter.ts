import { RangeFilter } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import type Field from '../Field';

export default class NumberFilter extends FilterableFields(RangeFilter) {
  constructor(public field: Field) {
    super();
  }
}
