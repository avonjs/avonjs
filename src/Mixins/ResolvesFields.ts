import FieldCollection from '../Collections/FieldCollection';
import { Field } from '../Fields';
import AvonRequest from '../Http/Requests/AvonRequest';
import { AbstractMixable, Model } from '../Contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class ResolvesFields extends Parent {
    public resource: any;

    /**
     * Resolve the index fields.
     */
    public indexFields(request: AvonRequest, resource: Model): FieldCollection {
      return this.availableFields(request)
        .filterForIndex(request, resource)
        .authorized(request)
        .resolveForDisplay(resource);
    }

    /**
     * Resolve the detail fields.
     */
    public detailFields(
      request: AvonRequest,
      resource: Model,
    ): FieldCollection {
      return this.availableFields(request)
        .filterForDetail(request, resource)
        .authorized(request)
        .resolveForDisplay(resource);
    }

    /**
     * Resolve the creation fields.
     */
    public creationFields(request: AvonRequest): FieldCollection {
      return this.availableFields(request)
        .authorized(request)
        .onlyCreationFields(request)
        .resolve(this.resource);
    }

    /**
     * Resolve the update fields.
     */
    public updateFields(request: AvonRequest): FieldCollection {
      return this.resolveFields(request).onlyUpdateFields(
        request,
        this.resource,
      );
    }
    /**
     * Resolve the review fields.
     */
    public reviewFields(
      request: AvonRequest,
      resource: Model,
    ): FieldCollection {
      return this.availableFields(request)
        .filterForReview(request, resource)
        .authorized(request)
        .resolveForDisplay(resource);
    }

    /**
     * Resolve the association fields.
     */
    public associationFields(request: AvonRequest): FieldCollection {
      return this.resolveFields(request)
        .filterForAssociation(request)
        .withoutUnresolvableFields()
        .withoutRelatableFields();
    }

    /**
     * Resolve the prunable fields.
     */
    // public prunableFields(
    //   request: AvonRequest,
    //   skipSoftDeletes = true,
    // ): FieldCollection<Field> {
    //   return this.availableFieldsOnIndexOrDetail(request)
    //     .filter((field) => {
    //       if (skipSoftDeletes && request.resourceSoftDeletes()) {
    //         return false;
    //       }

    //       return field.isPrunable();
    //     })
    //     .unique('attribute')
    //     .authorized(request)
    //     .resolveForDisplay(this.resource);
    // }

    /**
     * Resolve the filterable fields.
     */
    public filterableFields(request: AvonRequest): FieldCollection<Field> {
      return this.availableFieldsOnIndexOrDetail(request)
        .withOnlyFilterableFields()
        .authorized(request);
    }

    /**
     * Resolve the orderable fields.
     */
    public orderableFields(request: AvonRequest): FieldCollection<Field> {
      return this.availableFieldsOnIndexOrDetail(request)
        .withOnlyOrderableFields()
        .authorized(request);
    }

    /**
     * Get the fields for the given request.
     */
    public resolveFields(
      request: AvonRequest,
      resource?: Model,
    ): FieldCollection {
      return this.availableFields(request).resolve(resource ?? this.resource);
    }

    /**
     * Get the fields that are available for the given request.
     */
    public availableFields(request: AvonRequest): FieldCollection {
      const fieldsMethod = this.fieldsMethod(request);

      return new FieldCollection(this[fieldsMethod](request));
    }

    /**
     * Get the fields that are available on "index" or "detail" for the given request.
     */
    public availableFieldsOnIndexOrDetail(
      request: AvonRequest,
    ): FieldCollection {
      return this.buildAvailableFields(request, [
        'fieldsForIndex',
        'fieldsForDetail',
      ]);
    }

    /**
     * Get the fields that are available on "forms" for the given request.
     */
    public availableFieldsOnForms(request: AvonRequest): FieldCollection {
      return this.buildAvailableFields(request, [
        'fieldsForCreate',
        'fieldsForUpdate',
      ]);
    }

    /**
     * Get the fields that are available for the given request.
     */
    public buildAvailableFields(
      request: AvonRequest,
      methods: string[],
    ): FieldCollection {
      return new FieldCollection([
        ...this.fields(request),
        ...methods.flatMap((method) => {
          return this[method as keyof ResolvesFields](request);
        }),
      ]);
    }

    /**
     * Compute the method to use to get the available fields.
     */
    public fieldsMethod(request: AvonRequest): keyof ResolvesFields {
      if (request.isResourceIndexRequest()) {
        return 'fieldsForIndex';
      }

      if (request.isResourceDetailRequest()) {
        return 'fieldsForDetail';
      }

      if (request.isResourceReviewRequest()) {
        return 'fieldsForReview';
      }

      if (request.isCreateOrAttachRequest()) {
        return 'fieldsForCreate';
      }

      if (request.isUpdateOrUpdateAttachedRequest()) {
        return 'fieldsForUpdate';
      }

      if (request.isResourceAssociationRequest()) {
        return 'fieldsForAssociation';
      }

      return 'fields';
    }

    /**
     * Get the fields available on the entity.
     */
    public fieldsForCreate(request: AvonRequest): Field[] {
      return this.fields(request);
    }

    /**
     * Get the fields available on the entity.
     */
    public fieldsForUpdate(request: AvonRequest): Field[] {
      return this.fields(request);
    }

    /**
     * Get the fields available on the entity.
     */
    public fieldsForIndex(request: AvonRequest): Field[] {
      return this.fields(request);
    }

    /**
     * Get the fields available on the entity.
     */
    public fieldsForDetail(request: AvonRequest): Field[] {
      return this.fields(request);
    }

    /**
     * Get the fields available on the entity.
     */
    public fieldsForReview(request: AvonRequest): Field[] {
      return this.fields(request);
    }

    /**
     * Get the fields available on the entity.
     */
    public fieldsForAssociation(request: AvonRequest): Field[] {
      return this.fields(request);
    }

    /**
     * Get the fields available on the entity.
     */
    public abstract fields(request: AvonRequest): Field[];
  }

  return ResolvesFields;
};
