import { plural, singular } from 'pluralize';
import {
  Ability,
  type DetailSerializedResource,
  type IndexSerializedResource,
  type Model,
  type ResourceMetaData,
  type ReviewSerializedResource,
  type SoftDeletes,
  type StoreSerializedResource,
  type UnknownRecord,
  type UpdateSerializedResource,
} from './Contracts';
import type AvonRequest from './Http/Requests/AvonRequest';
import Authorizable from './Mixins/Authorizable';
import FillsFields from './Mixins/FillsFields';
import HasLifecycleMethods from './Mixins/HasLifecycleMethods';
import PerformsQueries from './Mixins/PerformsQueries';
import PerformsValidation from './Mixins/PerformsValidation';
import RecordsResourceEvents from './Mixins/RecordsResourceEvents';
import ResolvesActions from './Mixins/ResolvesActions';
import ResolvesFields from './Mixins/ResolvesFields';
import ResolvesFilters from './Mixins/ResolvesFilters';
import ResolvesOrderings from './Mixins/ResolvesOrderings';
import ResourceSchema from './Mixins/ResourceSchema';
import { slugify } from './helpers';
import { mixin } from './support/mixin';

export default abstract class Resource<
  TModel extends Model = Model,
> extends mixin(
  class {},
  Authorizable,
  ResolvesFields,
  ResolvesFilters,
  ResolvesOrderings,
  ResolvesActions,
  ResourceSchema,
  FillsFields,
  PerformsValidation,
  PerformsQueries,
  RecordsResourceEvents,
  HasLifecycleMethods,
) {
  /**
   * The resource model instance.
   */
  public resource: TModel;
  /**
   * The number of results to display when searching relatable resource.
   */
  public relatableSearchResults = 10;

  constructor(resource?: TModel) {
    super();
    this.resource = resource ?? (this.repository().model() as TModel);
  }

  /**
   * Create a new instance of the resource for the given model.
   */
  public forModel(resource: Model): Resource {
    const Constructor = this.constructor.prototype.constructor;

    return new Constructor(resource);
  }

  /**
   * Get the uri-key name of the resource
   */
  public uriKey(): string {
    return slugify(plural(singular(this.constructor.name)));
  }

  /**
   * Get the pagination per-page values
   */
  public perPageOptions(): number[] {
    return [15, 25, 50];
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForIndex(
    request: AvonRequest,
  ): Promise<IndexSerializedResource> {
    return this.serializeIndex(
      request,
      this.indexFields(request, this.resource)
        .withoutUnresolvableFields()
        .fieldValues(request),
    );
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForAssociation(
    request: AvonRequest,
  ): Promise<IndexSerializedResource> {
    return this.serializeIndex(
      request,
      this.associationFields(request).fieldValues(request),
    );
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  protected async serializeIndex(request: AvonRequest, fields: UnknownRecord) {
    return {
      metadata: this.resourceMetaData(),
      authorization: {
        authorizedToView: await this.authorizedTo(request, Ability.view),
        authorizedToUpdate: await this.authorizedTo(request, Ability.update),
        authorizedToDelete: await this.authorizedTo(request, Ability.delete),
        authorizedToForceDelete: this.softDeletes()
          ? await this.authorizedTo(request, Ability.forceDelete)
          : undefined,
        authorizedToRestore: this.softDeletes()
          ? await this.authorizedTo(request, Ability.restore)
          : undefined,
        authorizedToReview: this.softDeletes()
          ? await this.authorizedTo(request, Ability.restore)
          : undefined,
      },
      fields,
    };
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForStore(
    request: AvonRequest,
  ): Promise<StoreSerializedResource> {
    return {
      metadata: this.resourceMetaData(),
      authorization: {
        authorizedToUpdate: await this.authorizedTo(request, Ability.update),
        authorizedToDelete: await this.authorizedTo(request, Ability.delete),
        authorizedToForceDelete: this.softDeletes()
          ? await this.authorizedTo(request, Ability.forceDelete)
          : undefined,
      },
      fields: { id: this.resource.getKey() },
    };
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForUpdate(
    request: AvonRequest,
  ): Promise<UpdateSerializedResource> {
    return {
      metadata: this.resourceMetaData(),
      authorization: {
        authorizedToDelete: await this.authorizedTo(request, Ability.delete),
        authorizedToForceDelete: this.softDeletes()
          ? await this.authorizedTo(request, Ability.forceDelete)
          : undefined,
      },
      fields: { id: this.resource.getKey() },
    };
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForDetail(
    request: AvonRequest,
  ): Promise<DetailSerializedResource> {
    return {
      metadata: this.resourceMetaData(),
      authorization: {
        authorizedToUpdate: await this.authorizedTo(request, Ability.update),
        authorizedToDelete: await this.authorizedTo(request, Ability.delete),
        authorizedToForceDelete: this.softDeletes()
          ? await this.authorizedTo(request, Ability.forceDelete)
          : undefined,
      },
      fields: this.detailFields(request, this.resource)
        .withoutUnresolvableFields()
        .fieldValues(request),
    };
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForReview(
    request: AvonRequest,
  ): Promise<ReviewSerializedResource> {
    return {
      metadata: this.resourceMetaData(),
      authorization: {
        authorizedToForceDelete: await this.authorizedTo(
          request,
          Ability.forceDelete,
        ),
        authorizedToRestore: await this.authorizedTo(request, Ability.restore),
      },
      fields: this.reviewFields(request, this.resource)
        .withoutUnresolvableFields()
        .fieldValues(request),
    };
  }

  /**
   * Get the resource metadata.
   */
  protected resourceMetaData(): ResourceMetaData {
    return {
      softDeletes: this.softDeletes(),
      softDeleted: this.isSoftDeleted(),
    };
  }

  /**
   * Determine whether a given resource is "soft-deleted".
   */
  public isSoftDeleted(): boolean {
    return (
      this.softDeletes() &&
      (this.repository() as unknown as SoftDeletes<TModel>).isSoftDeleted(
        this.resource,
      )
    );
  }

  /**
   * Get the resource name fo events.
   */
  public resourceName(): string {
    return this.uriKey();
  }
}
