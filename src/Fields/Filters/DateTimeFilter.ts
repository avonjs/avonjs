import { DateTime } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import type Field from '../Field';

export default class DateTimeFilter extends FilterableFields(DateTime) {
  constructor(public field: Field) {
    super();
  }
}
