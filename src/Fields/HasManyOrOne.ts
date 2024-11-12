import type AvonRequest from '../Http/Requests/AvonRequest';

import { type AnyValue, type Model, Operator } from '../Contracts';
import type { Filter } from '../Filters';
import HasOneOrManyFilter from './Filters/HasOneOrManyFilter';
import Relation from './Relation';
import { guessForeignKey } from './ResourceRelationshipGuesser';

export default abstract class HasManyOrOne extends Relation {
  /**
   * Indicates related resources have to load.
   */
  public loaded = true;

  constructor(resource: string, relation?: string) {
    super(resource, relation);
    this.foreignKey = '';
    this.ownerKey = '';
  }

  public filterableAttribute(request: AvonRequest): string {
    return this.ownerKeyName(request);
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new HasOneOrManyFilter(this);
  }

  /**
   * Get attribute that hold the related model key.
   */
  public foreignKeyName(request: AvonRequest): string {
    return String(this.foreignKey).length > 0
      ? this.foreignKey
      : guessForeignKey(request.resource());
  }

  /**
   * Get attribute that hold the related model key.
   */
  public ownerKeyName(request: AvonRequest): string {
    return String(this.ownerKey).length > 0
      ? this.ownerKey
      : request.model().getKeyName();
  }

  /**
   * Resolve related value for given resources.
   */
  async resolveRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<AnyValue> {
    const relatables = await this.searchRelatables(request, resources);

    resources.forEach((resource) => {
      resource.setAttribute(
        this.attribute,
        relatables.filter((relatable) => {
          const relatableKey = String(
            relatable.getAttribute(this.foreignKeyName(request)),
          );
          const resourceKey = String(
            resource.getAttribute(this.ownerKeyName(request)),
          );

          return relatableKey === resourceKey;
        }),
      );
    });
  }

  /**
   * Get related models for given resources.
   */
  public async searchRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<Model[]> {
    return await this.relatedResource
      .resolveRepository(request)
      .where({
        key: this.foreignKeyName(request),
        value: resources
          .map((resource) => {
            return resource.getAttribute(this.ownerKeyName(request));
          })
          .filter((value) => value),
        operator: Operator.in,
      })
      .all();
  }

  /**
   * Determine field is fillable or not.
   */
  public fillable(): boolean {
    return false;
  }
}
