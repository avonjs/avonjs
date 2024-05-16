import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import {
  AbstractMixable,
  FilterableCallback,
  Model,
  Operator,
} from '../Contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Filterable extends Parent {
    /**
     * The callback to be used for the field's default value.
     */
    public filterableCallback?: FilterableCallback | boolean;

    /**
     * Apply the filter to the given query.
     */
    public async applyFilter(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
      value: any,
    ): Promise<any> {
      if (typeof this.filterableCallback === 'function') {
        await this.filterableCallback?.apply(this, [
          request,
          queryBuilder,
          value,
        ]);
      }
    }

    /**
     * Make the field filter.
     */
    public resolveFilter(request: AvonRequest): Filter | undefined {
      // prevent resolving fields that do not use for filtering
      if (this.filterableCallback) {
        return this.makeFilter(request);
      }
    }

    /**
     * The callback used to determine if the field is filterable.
     */
    public filterable(callback: FilterableCallback | boolean = true): this {
      this.filterableCallback = callback;

      return this;
    }

    /**
     * Make the field filter.
     */
    public abstract makeFilter(request: AvonRequest): Filter;

    /**
     * Define filterable attribute.
     */
    public abstract filterableAttribute(request: AvonRequest): string;
  }

  return Filterable;
};
