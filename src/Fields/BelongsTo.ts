import Joi from 'joi';
import FieldCollection from '../Collections/FieldCollection';
import {
  Ability,
  type AnyRecord,
  type AnyValue,
  type FilledCallback,
  type Model,
  type OpenApiSchema,
  Operator,
  type Optional,
  type Rules,
  type SoftDeletes,
  type Transaction,
} from '../Contracts';
import type { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';
import BelongsToFilter from './Filters/BelongsToFilter';
import Relation from './Relation';

export default class BelongsTo extends Relation {
  /**
   * Indicates trashed items have to be included in the related resource.
   */
  public withTrashed = true;

  /**
   * Prevent the trashed item from being included in the query.
   */
  public withoutTrashed() {
    this.withTrashed = false;

    return this;
  }

  /**
   * Mutate the field value for response.
   */
  public getMutatedValue(request: AvonRequest, value: AnyValue): AnyValue {
    return this.isLoaded() ? super.getMutatedValue(request, value)[0] : value;
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fillForAction<TModel extends Model>(
    request: AvonRequest,
    model: TModel,
  ): AnyValue {
    if (request.exists(this.attribute)) {
      model.setAttribute(
        this.attribute,
        this.relatedResource
          .resolveRepository(request)
          .find(request.input(this.attribute)),
      );
    }
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  protected fillAttributeFromRequest<TModel extends Model>(
    request: AvonRequest,
    requestAttribute: string,
    model: TModel,
    attribute: string,
  ): Optional<FilledCallback> {
    if (!request.exists(requestAttribute)) {
      this.fillAttributeFromDefault(
        request,
        model,
        this.foreignKeyName(request),
      );

      return;
    }

    const value = request.get(requestAttribute);

    model.setAttribute(
      this.foreignKeyName(request),
      this.isValidNullValue(value) ? this.nullValue() : value,
    );

    return async (request, model, transaction) => {
      await request
        .newResource(model)
        .authorizeTo(request, Ability.add, [
          await this.getRelatedResource(request, value, transaction),
        ]);
    };
  }

  /**
   * Get related models for given resources.
   */
  public async searchRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<Model[]> {
    const query = this.relatedResource.resolveRepository(request).where({
      key: this.ownerKeyName(request),
      value: resources
        .map((resource) => resource.getAttribute(this.foreignKeyName(request)))
        .filter((value) => value),
      operator: Operator.in,
    });

    return this.softDeletes() //@ts-ignore
      ? query.withTrashed().all()
      : query.all();
  }

  /**
   * Format the given related resource.
   */
  public formatRelatedResource(
    request: AvonRequest,
    resource: Model,
  ): AnyRecord {
    const repository = this.relatedResource.resolveRepository(
      request,
    ) as unknown as SoftDeletes<Model>;
    const softDeleted =
      this.softDeletes() && repository.isSoftDeleted(resource);

    return {
      ...new FieldCollection(this.relatableFields(request))
        .resolve(resource)
        .fieldValues(request),
      softDeleted,
    };
  }

  /**
   * Indicates related resource soft deletes applied.
   */
  protected softDeletes(): boolean {
    return this.withTrashed && this.relatedResource.softDeletes();
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new BelongsToFilter(this);
  }

  /**
   * Determine field is resolvable or not.
   */
  public resolvable(): boolean {
    return true;
  }

  /**
   * Determine if the underlying file should be pruned when the resource is deleted.
   */
  public isPrunable(): boolean {
    return false;
  }

  /**
   * Determine field is orderable or not.
   */
  public isOrderable(): boolean {
    return true;
  }

  /**
   * Define orderable attribute.
   */
  public orderableAttribute(request: AvonRequest): string {
    return this.foreignKeyName(request);
  }

  /**
   * Get the validation rules for this field.
   */
  public getRules(request: AvonRequest): Rules {
    const rules = this.isNullable()
      ? Joi.any().allow(null)
      : Joi.any().required();

    return {
      [this.attribute]: rules.external(async (value, { error }) => {
        if (this.isValidNullValue(value)) {
          return this.nullValue();
        }

        if ((await this.getRelatedResource(request, value)) === undefined) {
          return error('any.custom', {
            error: new Error(`Related resource with ID:'${value}' not found`),
          });
        }

        return value;
      }),
    };
  }

  protected async getRelatedResource(
    request: AvonRequest,
    id: string | number,
    transaction?: Transaction,
  ) {
    const repository = this.relatedResource
      .resolveRepository(request)
      .setTransaction(transaction)
      .where({
        key: this.ownerKeyName(request),
        operator: Operator.eq,
        value: id,
      });
    // to ensure only valid data attached
    this.relatableQueryCallback.apply(this, [request, repository]);

    return repository.first();
  }

  /**
   * Get the base swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.baseSchema(request),
      default: this.isNullable() ? null : this.resolveDefaultValue(request),
      type: 'number',
      oneOf: [{ type: 'string' }, { type: 'number' }],
    };
  }

  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...this.baseSchema(request),
      default: this.isNullable() ? null : this.resolveDefaultValue(request),
      description: [
        this.helpText,
        `use the "associable/${this.attribute}" to retrieve data`,
      ].join('</br>'),
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected responseSchema(request: AvonRequest): OpenApiSchema {
    if (!this.isLoaded()) {
      return this.baseSchema(request);
    }

    return {
      ...super.responseSchema(request),
      type: 'object',
      properties: {
        ...new FieldCollection(this.schemaFields(request)).responseSchemas(
          request,
        ),
        softDeleted: {
          type: 'boolean',
          default: false,
          description:
            'Indicates whether the related resource is soft-deleted or not',
        },
      },
      default: null,
      nullable: true,
      oneOf: undefined,
    };
  }
}
