import FieldNotFoundException from '../../Exceptions/FieldNotFoundException';
import type { Field } from '../../Fields';
import ResourceDetailRequest from './ResourceDetailRequest';

export default class ResourceLookupByFieldRequest extends ResourceDetailRequest {
  /**
   * Find the model instance for the request.
   */
  public findModelQuery(resourceId?: number) {
    const repository = this.repository();

    this.field().applyLookup(this, repository, this.resourceId());

    return repository;
  }

  /**
   * Get the field name.
   */
  public field(): Field {
    const field = this.resource()
      .resolveFields(this)
      .findFieldByAttribute(this.route('field'));

    FieldNotFoundException.unless(field);

    return field;
  }
}
