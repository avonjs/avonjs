import { TextFilter as Filter } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import Field from '../Field';

export default class extends FilterableFields(Filter) {
  constructor(public field: Field) {
    super();
  }
}
