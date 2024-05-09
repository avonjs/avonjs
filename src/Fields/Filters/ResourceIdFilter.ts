import FilterableFields from '../../Mixins/FilterableFields';
import { ResourceId } from '../../Filters';
import Field from '../Field';

export default class ResourceIdFilter extends FilterableFields(ResourceId) {
  constructor(public field: Field) {
    super();
  }
}
