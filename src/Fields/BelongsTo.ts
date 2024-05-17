import Joi from 'joi';
import FieldCollection from '../Collections/FieldCollection';
import AvonRequest from '../Http/Requests/AvonRequest';
import {
  Ability,
  FilledCallback,
  Model,
  OpenApiSchema,
  Operator,
  Rules,
  SoftDeletes,
  Transaction,
} from '../Contracts';
import Relation from './Relation';
import { Filter } from '../Filters';
import BelongsToFilter from './Filters/BelongsToFilter';

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
  public getMutatedValue(request: AvonRequest, value: any): any {
    return this.isLoaded() ? super.getMutatedValue(request, value)[0] : value;
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fillForAction<TModel extends Model>(
    request: AvonRequest,
    model: TModel,
  ): any {
    if (request.exists(this.attribute)) {
      model.setAttribute(
        this.attribute,
        this.relatedResource.repository().find(request.input(this.attribute)),
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
  ): FilledCallback | undefined {
    if (!request.exists(requestAttribute)) {
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
    const query = this.relatedResource.repository().where({
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
  ): Record<string, any> {
    const repository =
      this.relatedResource.repository() as unknown as SoftDeletes<Model>;
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
    return this.relatedResource
      .repository()
      .setTransaction(transaction)
      .where({
        key: this.ownerKeyName(request),
        operator: Operator.eq,
        value: id,
      })
      .first();
  }

  /**
   * Get the base swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...{
        ...super.baseSchema(request),
        items: undefined,
      },
      default: this.isNullable() ? null : this.resolveDefaultValue(request),
      type: undefined,
      oneOf: [{ type: 'number' }, { type: 'string' }],
    };
  }

  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...super.payloadSchema(request),
      default: this.isNullable() ? null : this.resolveDefaultValue(request),
      description: `use the "associable/${this.attribute}" to retrieve data`,
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
