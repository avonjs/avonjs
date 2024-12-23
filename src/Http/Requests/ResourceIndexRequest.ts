import {
  type IndexSerializedResource,
  type MatchedQueryHandlers,
  type Model,
  RequestTypes,
  type SearchCollection,
} from '../../Contracts';
import type { Filter } from '../../Filters';
import type { Ordering } from '../../Orderings';
import AvonRequest from './AvonRequest';
import QueryParser from './QueryParser';

export default class ResourceIndexRequest extends AvonRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.ResourceIndexRequest;
  }

  /**
   * Get the paginator instance for the index request.
   */
  public async searchIndex(): Promise<{
    resources: IndexSerializedResource[];
    count: number;
  }> {
    const repository = await this.resource().search(
      this,
      this.filters(),
      this.orderings(),
      this.trashed(),
    );

    const { items, count }: SearchCollection<Model> = await repository.search(
      this.string('search', ''),
      this.currentPage(),
      this.perPage(),
    );

    await Promise.all(
      this.resource()
        .indexFields(this, this.model())
        .onlyLoadedLazyFields()
        .map((field) => field.resolveForResources(this, items)),
    );

    return {
      count,
      resources: await Promise.all(
        items.map((item) => this.newResource(item).serializeForIndex(this)),
      ),
    };
  }

  /**
   * Get the page number.
   */
  public currentPage(): number {
    return this.number('page', 1);
  }

  /**
   * Get per page.
   */
  public perPage(): number {
    const perPageOptions = this.resource().perPageOptions();
    const perPage = this.number('perPage');

    return perPageOptions.includes(perPage) ? perPage : perPageOptions[0];
  }

  /**
   * Get the filters for the request.
   */
  public filters(): MatchedQueryHandlers<Filter> {
    return new QueryParser<Filter>(
      this.query('filters', []),
      this.availableFilters(),
    ).matches();
  }

  /**
   * Get all of the possibly available filters for the request.
   */
  protected availableFilters(): Filter[] {
    return this.resource().availableFilters(this);
  }

  /**
   * Check if filter found in request.
   */
  protected hasFilter(key: string): boolean {
    return this.exists(`filters.${key}`);
  }

  /**
   * Get the orderings for the request.
   */
  public orderings(): MatchedQueryHandlers<Ordering> {
    return new QueryParser<Ordering>(
      this.query('orders', []),
      this.availableOrderings(),
    ).matches();
  }

  /**
   * Get all of the possibly available orderings for the request.
   */
  protected availableOrderings(): Ordering[] {
    return this.resource().availableOrderings(this);
  }
}
