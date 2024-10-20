import type { ResolveCallback } from '../Contracts';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';
import ResourceIdFilter from './Filters/ResourceIdFilter';
import Integer from './Integer';

export default class ID extends Integer {
  constructor(attribute?: string, resolveCallback?: ResolveCallback) {
    super(attribute ?? 'id', resolveCallback);
    this.exceptOnForms().orderable().filterable();
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new ResourceIdFilter(this);
  }
}
