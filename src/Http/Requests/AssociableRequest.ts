import { RequestTypes } from '../../Contracts';
import FieldNotFoundException from '../../Exceptions/FieldNotFoundException';
import type { Filter } from '../../Filters';
import type { Ordering } from '../../Orderings';
import ResourceIndexRequest from './ResourceIndexRequest';

export default class AssociableRequest extends ResourceIndexRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.AssociableRequest;
  }

  /**
   * Get the relatable field.
   */
  public relatedField() {
    const field = this.resource()
      .availableFieldsOnForms(this)
      .withOnlyRelatableFields()
      .findFieldByAttribute(this.route('field') as string);

    FieldNotFoundException.unless(field);

    return field;
  }

  /**
   * Get all of the possibly available filters for the request.
   */
  protected availableFilters(): Filter[] {
    return this.relatedField().availableFilters(this);
  }

  /**
   * Get all of the possibly available orderings for the request.
   */
  protected availableOrderings(): Ordering[] {
    return this.relatedField().availableOrderings(this);
  }
}
