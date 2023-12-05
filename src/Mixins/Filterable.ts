import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import {
  AbstractMixable,
  FilterableCallback,
  Model,
  Operator,
} from '../contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Filterable extends Parent {
    /**
     * The callback to be used for the field's default value.
     */
    public filterableCallback?: FilterableCallback;

    /**
     * Apply the filter to the given query.
     */
    public async applyFilter(
      request: AvonRequest,
      repository: Repository<Model>,
      value: any,
    ): Promise<any> {
      await this.filterableCallback?.apply(this, [request, repository, value]);
    }

    /**
     * Make the field filter.
     */
    public resolveFilter(request: AvonRequest): Filter | undefined {
      // prevent resolving fields that do not use for filtering
      if (this.filterableCallback != null) {
        return this.makeFilter(request);
      }
    }

    /**
     * The callback used to determine if the field is filterable.
     */
    public filterable(callback?: FilterableCallback): this {
      this.filterableCallback = callback ?? this.defaultFilterableCallback();

      return this;
    }

    /**
     * Define the default filterable callback.
     */
    public defaultFilterableCallback(): FilterableCallback {
      return (
        request: AvonRequest,
        repository: Repository<Model>,
        value: any,
      ) => {
        repository.where({
          key: this.filterableAttribute(request),
          operator: Operator.eq,
          value,
        });
      };
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
