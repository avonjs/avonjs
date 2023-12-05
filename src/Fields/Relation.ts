import collect from 'collect.js';
import { OpenAPIV3 } from 'openapi-types';
import Avon from '../Avon';
import FieldCollection from '../Collections/FieldCollection';
import { RuntimeException } from '../Exceptions';
import { Filter } from '../Filters';
import AssociableRequest from '../Http/Requests/AssociableRequest';
import AvonRequest from '../Http/Requests/AvonRequest';
import Resource from '../Resource';
import {
  RelatableQueryCallback,
  DisplayFieldCallback,
  Model,
  TrashedStatus,
} from '../contracts';
import Field from './Field';
import RelatableFilter from './Filters/RelatableFilter';
import { guessRelation } from './ResourceRelationshipGuesser';
import { Repository } from '../Repositories';

export default abstract class Relation extends Field {
  /**
   * Indicates related resources have to load.
   */
  public loaded: boolean = false;

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
  ) => request.resource().relatableQuery(request, repository) ?? repository;

  constructor(resource: string, relation?: string) {
    const relatedResource = Avon.resourceForKey(resource);

    RuntimeException.when(
      relatedResource === undefined,
      `Resource '${resource}' not found for relationship ${
        relation ?? resource
      }`,
    );

    relation = relation ?? guessRelation(relatedResource as Resource);
    // init parent
    super(relation);
    this.relation = relation;
    this.relatedResource = relatedResource as Resource;
    this.ownerKey = this.relatedResource.repository().model().getKeyName();
    this.foreignKey = `${this.relation}_${this.ownerKey}`;
  }

  /**
   * Indicates fields uses to display in relation request.
   */
  protected relatableFields: DisplayFieldCallback = (request: AvonRequest) => {
    return this.relatedResource
      .indexFields(request, this.relatedResource.resource)
      .withoutRelatableFields()
      .all();
  };

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: any): any {
    return collect(value as Model[])
      .map((relatable) => this.formatRelatedResource(request, relatable))
      .values()
      .all();
  }

  /**
   * Format the given related resource.
   */
  public formatRelatedResource(
    request: AvonRequest,
    resource: Model,
  ): Record<string, any> {
    return new FieldCollection(this.relatableFields(request))
      .resolve(resource)
      .mapWithKeys((field: Field) => [field.attribute, field.getValue(request)])
      .all();
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
   * Determine field is resolvable or not.
   */
  public resolvable(): boolean {
    return this.isLoaded();
  }

  /**
   * Specify related resources to load.
   */
  public load(): this {
    this.loaded = true;

    return this;
  }

  /**
   * Determine that related resource loaded.
   */
  public isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Resolve related value for given resources.
   */
  async resolveRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<any> {
    const relatables = await this.searchRelatables(request, resources);

    resources.forEach((resource) => {
      resource.setAttribute(
        this.attribute,
        relatables.filter((relatable) => {
          return (
            // eslint-disable-next-line eqeqeq
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
    withTrashed: boolean = false,
  ): Promise<Repository<Model>> {
    const repository = await this.relatedResource.search(
      request,
      [],
      [],
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
  public resolve(resource: Model, attribute?: string): any {
    super.resolve(
      resource,
      this.isLoaded() || this.foreignKey === '' ? attribute : this.foreignKey,
    );
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new RelatableFilter(this);
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

  /**
   * Get the swagger-ui schema.
   */
  schema(
    request: AvonRequest,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
    const fields = new FieldCollection(this.relatableFields(request));
    return {
      ...super.schema(request),
      type: 'array',
      default: [
        fields
          .mapWithKeys((field: Field) => [
            field.attribute,
            field.getValue(request),
          ])
          .all(),
      ],
      items: {
        type: 'object',
        properties: fields.mapWithKeys((field: Field) => [
          field.attribute,
          field.schema(request),
        ]) as Record<
          string,
          OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject
        >,
      },
    };
  }
}
