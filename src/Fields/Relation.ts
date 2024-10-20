import { snakeCase } from 'change-case-all';
import collect from 'collect.js';
import Avon from '../Avon';
import FieldCollection from '../Collections/FieldCollection';
import {
  type AnyValue,
  type DisplayFieldCallback,
  type Model,
  type OpenApiSchema,
  type RelatableQueryCallback,
  TrashedStatus,
} from '../Contracts';
import { RuntimeException } from '../Exceptions';
import { Filter } from '../Filters';
import type AssociableRequest from '../Http/Requests/AssociableRequest';
import type AvonRequest from '../Http/Requests/AvonRequest';
import { Ordering } from '../Orderings';
import type { Repository } from '../Repositories';
import type Resource from '../Resource';
import Lazy from './Lazy';
import { guessRelation } from './ResourceRelationshipGuesser';

export default abstract class Relation extends Lazy {
  /**
   * Name of the relationship.
   */
  public relation?: string;

  /**
   * The related resource instance
   */
  public relatedResource: Resource;

  /**
   * The foreign key of the parent model.
   * The attribute name that holds the parent model key.
   */
  public foreignKey: string;

  /**
   * The associated key on the child model.
   * Defaults to primary key of parent model.
   */
  public ownerKey: string;

  /**
   * The callback that should be run to associate relations.
   */
  public relatableQueryCallback: RelatableQueryCallback = (
    request: AvonRequest,
    repository: Repository<Model>,
  ) => this.relatedResource.relatableQuery(request, repository) ?? repository;

  constructor(resource: string, relation?: string) {
    const relatedResource = Avon.resourceForKey(resource) as Resource;

    RuntimeException.when(
      relatedResource === undefined,
      `Resource '${resource}' not found for relationship ${
        relation ?? resource
      }`,
    );

    super(relation ?? guessRelation(relatedResource));
    this.relation = this.attribute;
    this.relatedResource = relatedResource;
    this.ownerKey = this.relatedResource.repository().model().getKeyName();
    this.foreignKey = snakeCase(`${this.relation}_${this.ownerKey}`);
  }

  /**
   * Indicates fields uses to display in relation request.
   */
  protected relatableFields: DisplayFieldCallback = (request: AvonRequest) => {
    const fields = this.relatedResource.fieldsForAssociation(request);

    return new FieldCollection(fields)
      .filterForAssociation(request)
      .withoutUnresolvableFields()
      .withoutRelatableFields()
      .all();
  };

  /**
   * Get all of the possibly available filters for the request.
   */
  public availableFilters(request: AvonRequest): Filter[] {
    return new FieldCollection(this.relatableFields(request))
      .withOnlyFilterableFields()
      .authorized(request)
      .map((field) => field.resolveFilter(request))
      .filter((filter) => filter instanceof Filter)
      .unique((filter: Filter) => filter.key())
      .all() as Filter[];
  }

  /**
   * Get all of the possibly available filters for the request.
   */
  public availableOrderings(request: AvonRequest): Ordering[] {
    return new FieldCollection(this.relatableFields(request))
      .withOnlyOrderableFields()
      .authorized(request)
      .map((field) => field.resolveOrdering(request))
      .filter((ordering) => ordering instanceof Ordering)
      .unique((ordering: Ordering) => ordering.key())
      .all() as Ordering[];
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: AnyValue): AnyValue {
    return collect(value as Model[])
      .map((relatable) => this.formatRelatedResource(request, relatable))
      .values()
      .all();
  }

  /**
   * Format the given related resource.
   */
  public formatRelatedResource(request: AvonRequest, resource: Model) {
    return new FieldCollection(this.relatableFields(request))
      .resolve(resource)
      .fieldValues(request);
  }

  /**
   * Set related model foreign key.
   */
  public withForeignKey(foreignKey: string): this {
    this.foreignKey = foreignKey;

    return this;
  }

  /**
   * Get attribute that hold the related model key.
   */
  public foreignKeyName(request: AvonRequest): string {
    return this.foreignKey;
  }

  /**
   * Set related model owner key.
   */
  public withOwnerKey(ownerKey: string): this {
    this.ownerKey = ownerKey;

    return this;
  }

  /**
   * Get attribute that hold the related model key.
   */
  public ownerKeyName(request: AvonRequest): string {
    return this.ownerKey;
  }

  /**
   * Determine display fields.
   */
  public fields(callback: DisplayFieldCallback): this {
    this.relatableFields = callback;

    return this;
  }

  /**
   * Resolve value for given resources.
   */
  async resolveForResources(request: AvonRequest, resources: Model[]) {
    return this.resolveRelatables(request, resources);
  }

  /**
   * Resolve related value for given resources.
   */
  async resolveRelatables(request: AvonRequest, resources: Model[]) {
    const relatables = await this.searchRelatables(request, resources);

    resources.forEach((resource) => {
      resource.setAttribute(
        this.attribute,
        relatables.filter((relatable) => {
          return (
            // biome-ignore lint/suspicious/noDoubleEquals:
            relatable.getAttribute(this.ownerKeyName(request)) ==
            resource.getAttribute(this.foreignKeyName(request))
          );
        }),
      );
    });
  }

  /**
   * Get related models for given resources.
   */
  abstract searchRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<Model[]>;

  /**
   * Search associable resources.
   */
  public async searchAssociable(
    request: AssociableRequest,
    withTrashed = false,
  ): Promise<Repository<Model>> {
    const repository = await this.relatedResource.search(
      request,
      request.filters(),
      request.orderings(),
      withTrashed ? TrashedStatus.WITH : TrashedStatus.DEFAULT,
    );

    const query = this.relatableQueryCallback.apply(this, [
      request,
      repository,
    ]);

    return query ?? repository;
  }

  /**
   * Determine the associate relations query.
   */
  public relatableQueryUsing(
    relatableQueryCallback: RelatableQueryCallback,
  ): this {
    this.relatableQueryCallback = relatableQueryCallback;

    return this;
  }

  /**
   * Define filterable attribute.
   */
  public filterableAttribute(request: AvonRequest): string {
    return this.foreignKeyName(request);
  }

  /**
   * Resolve the field's value.
   */
  public resolve(resource: Model, attribute?: string): AnyValue {
    super.resolve(
      resource,
      this.isLoaded() || this.foreignKey === '' ? attribute : this.foreignKey,
    );
  }

  /**
   * Determine field is filterable or not.
   */
  public isFilterable(): boolean {
    return true;
  }

  /**
   * Determine field is orderable or not.
   */
  public isOrderable(): boolean {
    return false;
  }

  protected responseSchema(request: AvonRequest): OpenApiSchema {
    const fields = this.schemaFields(request);
    return {
      ...super.responseSchema(request),
      type: 'array',
      default: fields.fieldValues(request),
      items: { type: 'object', properties: fields.responseSchemas(request) },
    };
  }

  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    const fields = this.schemaFields(request);
    return {
      ...super.payloadSchema(request),
      type: 'array',
      default: fields.fieldValues(request),
      items: { type: 'object', properties: fields.payloadSchemas(request) },
    };
  }

  protected schemaFields(request: AvonRequest): FieldCollection {
    return new FieldCollection(this.relatableFields(request));
  }
}
