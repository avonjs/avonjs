import {
  type AbstractMixable,
  type AnyValue,
  type FilterableCallback,
  type Model,
  Operator,
} from '../Contracts';
import type { Field } from '../Fields';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Repository } from '../Repositories';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Lookupable extends Parent {
    /**
     * The callback to be used for the field's default value.
     */
    public lookupCallback?: FilterableCallback | boolean;

    /**
     * The key used to look up the resource.
     */
    public lookupKeyUsing?: string;

    /**
     * Apply the filter to the given query.
     */
    public async applyLookup(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
      value: AnyValue,
    ) {
      if (typeof this.lookupCallback === 'function') {
        await this.lookupCallback?.apply(this, [request, queryBuilder, value]);
      } else {
        queryBuilder.where({
          key: this.lookupKey(),
          value: value,
          operator: Operator.eq,
        });
      }
    }

    /**
     * Indicates the field is look up able.
     */
    public isLookupable(): boolean {
      return Boolean(this.lookupCallback);
    }

    /**
     * The callback used to determine if the field is lookupable.
     */
    public lookupable(callback: FilterableCallback | boolean = true) {
      this.lookupCallback = callback;

      return this;
    }

    /**
     * Get the look up key name.
     */
    public lookupKey() {
      return this.lookupKeyUsing ?? (this as unknown as Field).attribute;
    }

    /**
     * Set the look up key name.
     */
    public lookupUsing(lookupKey: string) {
      this.lookupKeyUsing = lookupKey;

      return this;
    }
  }

  return Lookupable;
};
