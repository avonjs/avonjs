import { ResourceId } from '../../Filters';
import FilterableFields from '../../Mixins/FilterableFields';
import type Field from '../Field';

export default class ResourceIdFilter extends FilterableFields(ResourceId) {
  constructor(public field: Field) {
    super();
  }
}
