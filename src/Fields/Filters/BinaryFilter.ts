import { BooleanFilter } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import type Field from '../Field';

export default class BinaryFilter extends FilterableFields(BooleanFilter) {
  constructor(public field: Field) {
    super();
  }
}
