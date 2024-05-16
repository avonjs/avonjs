import FilterableFields from '../../Mixins/FilterableFields';
import { DateTime } from '../../Filters';
import Field from '../Field';

export default class DateTimeFilter extends FilterableFields(DateTime) {
  constructor(public field: Field) {
    super();
  }
}
