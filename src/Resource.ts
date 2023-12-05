import { plural, singular } from 'pluralize';
import { Field } from './Fields';
import AvonRequest from './Http/Requests/AvonRequest';
import Authorizable from './Mixins/Authorizable';
import FillsFields from './Mixins/FillsFields';
import HasLifecycleMethods from './Mixins/HasLifecycleMethods';
import PerformsQueries from './Mixins/PerformsQueries';
import PerformsValidation from './Mixins/PerformsValidation';
import ResolvesActions from './Mixins/ResolvesActions';
import ResolvesFields from './Mixins/ResolvesFields';
import ResolvesFilters from './Mixins/ResolvesFilters';
import ResolvesOrderings from './Mixins/ResolvesOrderings';
import ResourceSchema from './Mixins/ResourceSchema';
import {
  Model,
  IndexSerializedResource,
  Ability,
  DetailSerializedResource,
  ReviewSerializedResource,
} from './contracts';
import { slugify } from './helpers';
import RecordsResourceEvents from './Mixins/RecordsResourceEvents';
import { Action } from './Actions';

export default abstract class Resource extends ResourceSchema(
  RecordsResourceEvents(
    HasLifecycleMethods(
      FillsFields(
        ResolvesFields(
          Authorizable(
            ResolvesActions(
              ResolvesOrderings(
                ResolvesFilters(PerformsQueries(PerformsValidation(class {}))),
              ),
            ),
          ),
        ),
      ),
    ),
  ),
) {
  /**
   * The number of results to display when searching relatable resource.
   */
  public relatableSearchResults: number = 10;

  constructor(resource?: Model) {
    super();
    this.resource = resource ?? this.repository().model();
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
    return {
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
      fields: this.indexFields(request, this.resource)
        .withoutUnresolvableFields()
        .mapWithKeys((field: Field) => [
          field.attribute,
          field.getValue(request),
        ])
        .all(),
    };
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public serializeForAssociation(request: AvonRequest): Record<string, any> {
    return this.associationFields(request)
      .mapWithKeys((field: Field) => [field.attribute, field.getValue(request)])
      .all();
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForDetail(
    request: AvonRequest,
  ): Promise<DetailSerializedResource> {
    return {
      authorization: {
        authorizedToUpdate: await this.authorizedTo(request, Ability.update),
        authorizedToDelete: await this.authorizedTo(request, Ability.delete),
        authorizedToForceDelete: this.softDeletes()
          ? await this.authorizedTo(request, Ability.forceDelete)
          : undefined,
      },
      fields: this.detailFields(request, this.resource)
        .withoutUnresolvableFields()
        .mapWithKeys((field: Field) => [
          field.attribute,
          field.getValue(request),
        ]),
    };
  }

  /**
   * Prepare the resource for JSON serialization.
   */
  public async serializeForReview(
    request: AvonRequest,
  ): Promise<ReviewSerializedResource> {
    return {
      authorization: {
        authorizedToForceDelete: await this.authorizedTo(
          request,
          Ability.forceDelete,
        ),
        authorizedToRestore: await this.authorizedTo(request, Ability.restore),
      },
      fields: this.reviewFields(request, this.resource)
        .withoutUnresolvableFields()
        .mapWithKeys((field: Field) => [
          field.attribute,
          field.getValue(request),
        ]),
    };
  }

  /**
   * Get the resource name fo events.
   */
  public resourceName(): string {
    return this.uriKey();
  }
}
