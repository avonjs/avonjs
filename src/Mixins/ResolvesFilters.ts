import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { AbstractMixable } from '../contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class ResolvesFilters extends Parent {
    /**
     * Get the filters that are available for the given request.
     */
    public availableFilters(request: AvonRequest): Filter[] {
      return this.resolveFilters(request)
        .concat(this.resolveFiltersFromFields(request))
        .filter((filter) => filter.authorizedToSee(request));
    }

    /**
     * Get the filters for the given request.
     */
    public resolveFilters(request: AvonRequest): Filter[] {
      return this.filters(request);
    }

    /**
     * Get the filters from filterable fields for the given request.
     */
    public resolveFiltersFromFields(request: AvonRequest): Filter[] {
      return request
        .resource()
        .filterableFields(request)
        .map((field) => field.resolveFilter(request))
        .filter((filter) => filter instanceof Filter)
        .unique((filter: Filter) => filter.key())
        .all() as Filter[];
    }

    /**
     * Get the filters available on the entity.
     */
    public filters(request: AvonRequest): Filter[] {
      return [];
    }
  }

  return ResolvesFilters;
};
