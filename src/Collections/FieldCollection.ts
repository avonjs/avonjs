import { Collection } from 'collect.js';
import { Field } from '../Fields';
import Relation from '../Fields/Relation';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Model, OpenApiSchema } from '../Contracts';

export default class FieldCollection<
  TItem extends Field = Field,
> extends Collection<TItem> {
  /**
   * Find a given field by its attribute.
   */
  public findFieldByAttribute(
    attribute: string,
    defaultValue?: any,
  ): TItem | undefined {
    return this.first<TItem>(
      (field) => field.attribute === attribute,
      defaultValue,
    );
  }

  /**
   * Resolve value of fields.
   */
  public resolve(resource: Model): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.each((field) => field.resolve(resource)),
    );
  }

  /**
   * Resolve value of fields for display.
   */
  public resolveForDisplay(resource: Model): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.each((field) => field.resolveForDisplay(resource)),
    );
  }

  /**
   * Remove non-creation fields from the collection.
   */
  public onlyCreationFields(request: AvonRequest): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.isShownOnCreation(request)),
    );
  }

  /**
   * Remove non-update fields from the collection.
   */
  public onlyUpdateFields(
    request: AvonRequest,
    resource: Model,
  ): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.isShownOnUpdate(request, resource)),
    );
  }

  /**
   * Filter fields for showing on index.
   */
  public filterForIndex(
    request: AvonRequest,
    resource: Model,
  ): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.isShownOnIndex(request, resource)).values(),
    );
  }

  /**
   * Filter fields for showing on detail.
   */
  public filterForDetail(
    request: AvonRequest,
    resource: Model,
  ): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.isShownOnDetail(request, resource)).values(),
    );
  }

  /**
   * Filter fields for showing on review.
   */
  public filterForReview(
    request: AvonRequest,
    resource: Model,
  ): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.isShownOnReview(request, resource)).values(),
    );
  }

  /**
   * Filter fields for showing on review.
   */
  public filterForAssociation(request: AvonRequest): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.isShownOnAssociation(request)).values(),
    );
  }

  /**
   * Reject if the field supports Filterable Field.
   */
  public withOnlyFilterableFields(): FieldCollection<Field> {
    return new FieldCollection<Field>(
      this.filter((field) => field.isFilterable()).values(),
    );
  }

  /**
   * Reject if the field supports Orderable Field.
   */
  public withOnlyOrderableFields(): FieldCollection<Field> {
    return new FieldCollection<Field>(
      this.filter((field) => field.isOrderable()).values(),
    );
  }

  /**
   * Reject if the field not supports Relatable Field.
   */
  public withOnlyRelatableFields(): FieldCollection<Relation> {
    return new FieldCollection<Relation>(
      this.filter((field) => field instanceof Relation).values(),
    );
  }

  /**
   * Reject if the field not supports Relatable Field and not eager loaded.
   */
  public onlyLoadedRelatableFields(): FieldCollection<Relation> {
    return new FieldCollection<Relation>(
      this.withOnlyRelatableFields()
        .filter((field) => field.isLoaded())
        .values(),
    );
  }

  /**
   * Reject if the field is relatable Field.
   */
  public withoutRelatableFields(): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.reject((field) => field instanceof Relation).values(),
    );
  }

  /**
   * Reject if the field is relatable Field.
   */
  public withoutUnfillableFields(): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.fillable()).values(),
    );
  }

  /**
   * Reject if the field is relatable Field.
   */
  public withoutUnresolvableFields(): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.resolvable()).values(),
    );
  }

  /**
   * Filter elements should be displayed for the given request.
   */
  public authorized(request: AvonRequest): FieldCollection<TItem> {
    return new FieldCollection<TItem>(
      this.filter((field) => field.authorize(request)).values(),
    );
  }

  /**
   * Transform fields to open api valid schema.
   */
  public payloadSchemas(request: AvonRequest): Record<string, OpenApiSchema> {
    return this.mapWithKeys((field: Field) => [
      field.attribute,
      field.schema(request).payload,
    ]).all() as unknown as Record<string, OpenApiSchema>;
  }
  /**
   * Transform fields to open api valid schema.
   */
  public responseSchemas(request: AvonRequest): Record<string, OpenApiSchema> {
    return this.mapWithKeys((field: Field) => [
      field.attribute,
      field.schema(request).response,
    ]).all() as unknown as Record<string, OpenApiSchema>;
  }

  /**
   * Transform fields to object by values.
   */
  public fieldValues(request: AvonRequest): Record<string, any> {
    return this.mapWithKeys((field: Field) => [
      field.attribute,
      field.getValue(request),
    ]).all();
  }
}
