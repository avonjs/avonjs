import {
  type AbstractMixable,
  Direction,
  type MatchedQueryHandlers,
  type Model,
  TrashedStatus,
} from '../Contracts';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Ordering } from '../Orderings';
import type { Repository } from '../Repositories';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class PerformQueries extends Parent {
    /**
     * Search repository for incoming request.
     */
    public async search(
      request: AvonRequest,
      filters: MatchedQueryHandlers<Filter> = [],
      orderings: MatchedQueryHandlers<Ordering> = [],
      withTrashed: TrashedStatus = TrashedStatus.DEFAULT,
    ): Promise<Repository<Model>> {
      return this.indexQuery(
        request,
        this.applySoftDeleteConstraint(
          await this.initializeSearch(request, filters, orderings),
          withTrashed,
        ),
      );
    }

    /**
     * Initialize the search configuration.
     */
    public async initializeSearch(
      request: AvonRequest,
      filters: MatchedQueryHandlers<Filter> = [],
      orderings: MatchedQueryHandlers<Ordering> = [],
    ): Promise<Repository<Model>> {
      const queryBuilder = this.queryBuilder(request);

      await this.applyFilters(request, queryBuilder, filters);
      await this.applyOrderings(request, queryBuilder, orderings);

      return queryBuilder;
    }

    /**
     * Get query builder.
     */
    public queryBuilder(request: AvonRequest): Repository<Model> {
      return this.resolveRepository(request);
    }

    /**
     * Resolve the resource repository.
     */
    public resolveRepository(request: AvonRequest): Repository<Model> {
      return this.repository().setTransaction(request.getTransaction());
    }

    /**
     * Apply the soft-delete into given query.
     */
    public applySoftDeleteConstraint(
      queryBuilder: Repository<Model>,
      withTrashed: TrashedStatus,
    ): Repository<Model> {
      const callback = {
        [TrashedStatus.WITH]: 'withTrashed',
        [TrashedStatus.ONLY]: 'onlyTrashed',
        [TrashedStatus.DEFAULT]: 'applySoftDelete',
      }[withTrashed];

      if (this.softDeletes() !== true) {
        return queryBuilder;
      }
      // @ts-ignore
      return queryBuilder[callback]();
    }

    /**
     * Apply any applicable filters to the repository.
     */
    public async applyFilters(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
      filters: MatchedQueryHandlers<Filter>,
    ): Promise<Repository<Model>> {
      await Promise.all(
        filters.map(({ handler, value }) => {
          return handler.apply(request, queryBuilder, value);
        }),
      );
      return queryBuilder;
    }

    /**
     * Apply any applicable orders to the repository.
     */
    public async applyOrderings(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
      orderings: MatchedQueryHandlers<Ordering> = [],
    ): Promise<Repository<Model>> {
      await Promise.all(
        orderings.map(({ handler, value }) => {
          return handler.apply(
            request,
            queryBuilder,
            value === Direction.DESC ? Direction.DESC : Direction.ASC,
          );
        }),
      );
      return queryBuilder;
    }

    /**
     * Build a "relatable" query for the given resource.
     *
     * This query determines which instances of the model may be attached to other resources.
     */
    public relatableQuery(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
    ): Repository<Model> {
      return queryBuilder;
    }

    /**
     * Build an "index" query for the given resource.
     */
    public indexQuery(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
    ): Repository<Model> {
      return queryBuilder;
    }

    /**
     * Build a "detail" query for the given resource.
     */
    public detailQuery(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
    ): Repository<Model> {
      return queryBuilder;
    }

    /**
     * Build a "review" query for the given resource.
     */
    public reviewQuery(
      request: AvonRequest,
      queryBuilder: Repository<Model>,
    ): Repository<Model> {
      return queryBuilder;
    }

    /**
     * Determine if this resource uses soft deletes.
     */
    public softDeletes(): boolean {
      return (
        //@ts-ignore
        typeof this.repository().withTrashed === 'function' &&
        //@ts-ignore
        typeof this.repository().onlyTrashed === 'function' &&
        //@ts-ignore
        typeof this.repository().applySoftDelete === 'function'
      );
    }

    /**
     * Get the repository.
     */
    public abstract repository(): Repository<Model>;
  }

  return PerformQueries;
};
