import assert from 'node:assert';
import Joi from 'joi';
import Avon from '../Avon';
import FieldCollection from '../Collections/FieldCollection';
import {
  Ability,
  type AnyRecord,
  type AnyValue,
  type Attachable,
  type FilledCallback,
  type Model,
  type OpenApiSchema,
  Operator,
  type Optional,
  type PivotFieldCallback,
  type PrimaryKey,
  type RelatableQueryCallback,
  type Rules,
  type SanitizeCallback,
} from '../Contracts';
import { RuntimeException } from '../Exceptions';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Repository } from '../Repositories';
import type Resource from '../Resource';
import Relation from './Relation';
import { guessForeignKey } from './ResourceRelationshipGuesser';

export default class BelongsToMany extends Relation {
  /**
   * The pivot resource instance
   */
  public pivotResource: Resource;

  /**
   * The foreign key of the related model.
   * The attribute name that holds the parent model key.
   */
  protected resourceForeignKey?: string;

  /**
   * The associated key on the related model.
   * Defaults to primary key of related model.
   */
  protected resourceOwnerKey?: string;

  /**
   * Indicates fields uses to update pivot table.
   */
  protected pivotFields: PivotFieldCallback = (request: AvonRequest) => [];

  /**
   * The callback that should be run to pivots table.
   */
  public pivotQueryCallback: RelatableQueryCallback = (
    request: AvonRequest,
    repository: Repository<Model>,
  ) => this.pivotResource.relatableQuery(request, repository) ?? repository;

  /**
   * The callback that should be run to sanitize related resources.
   */
  public sanitizeCallback: SanitizeCallback = (request, resources) => resources;

  constructor(resource: string, pivot: string, attribute?: string) {
    super(resource);

    this.pivotResource = this.getPivotResource(pivot);
    this.attribute = attribute ?? resource;

    this.nullable(true, (value) => !Array.isArray(value) || value.length === 0);
  }

  /**
   * Determine the pivot resource query.
   */
  public pivotQueryUsing(pivotQueryCallback: RelatableQueryCallback): this {
    this.pivotQueryCallback = pivotQueryCallback;

    return this;
  }

  /**
   * Get the pivot resource.
   */
  protected getPivotResource(resourceName: string) {
    const resource = Avon.resourceForKey(resourceName);

    RuntimeException.unless(
      resource,
      `Invalid pivot:${resourceName} prepared for relation ${this.attribute}`,
    );

    return resource;
  }

  /**
   * Determine pivot fields.
   */
  public pivots(callback: PivotFieldCallback): this {
    this.pivotFields = callback;

    return this;
  }

  /**
   * Get the validation rules for this field.
   */
  public getRules(request: AvonRequest): Rules {
    const rules = super.getRules(request);
    const pivotFields = this.pivotFields(request);
    const pivotRules = this.pivotResource.prepareRulesForValidator(
      pivotFields.map((field) => field.getRules(request)),
    );

    return {
      ...rules,
      [this.attribute]: rules[this.attribute].concat(
        pivotFields.length === 0
          ? Joi.array()
              .items(Joi.string(), Joi.number())
              .external(this.existenceRule(request))
          : Joi.array().items(
              Joi.object(pivotRules).append({
                id: Joi.alternatives(Joi.string(), Joi.number()).external(
                  this.existenceRule(request),
                ),
              }),
            ),
      ),
    };
  }

  /**
   * Get Joi rule to validate resource existence.
   */
  protected existenceRule(
    request: AvonRequest,
  ): Joi.ExternalValidationFunction {
    return async (value, { error }) => {
      if (this.isNullable() && (!Array.isArray(value) || value.length === 0)) {
        return;
      }

      try {
        const repository = this.relatedResource
          .resolveRepository(request)
          .where({
            key: this.ownerKeyName(request),
            operator: Operator.in,
            value,
          });
        // to ensure only valid data attached
        const query =
          this.relatableQueryCallback.apply(repository, [
            request,
            repository,
          ]) ?? repository;

        const resources = await query.all();

        if (resources.length !== value.length) {
          return error('any.custom', {
            error: new Error('Some of related resources not found'),
          });
        }
      } catch (err) {
        return error('any.custom', { error: err });
      }
    };
  }

  /**
   * Set related model foreign key.
   */
  public setResourceForeignKey(resourceForeignKey: string): this {
    this.resourceForeignKey = resourceForeignKey;

    return this;
  }

  /**
   * Get attribute that hold the related model key.
   */
  public resourceForeignKeyName(request: AvonRequest): string {
    return this.resourceForeignKey ?? guessForeignKey(request.resource());
  }

  /**
   * Set the related model owner key.
   */
  public setResourceOwnerKey(resourceOwnerKey: string): this {
    this.resourceOwnerKey = resourceOwnerKey;

    return this;
  }

  /**
   * Get attribute that hold the related model key.
   */
  public resourceOwnerKeyName(request: AvonRequest): string {
    return this.resourceOwnerKey ?? request.model().getKeyName();
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fillForAction<TModel extends Model>(
    request: AvonRequest,
    model: TModel,
  ): AnyValue {}

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  protected fillAttributeFromRequest(
    request: AvonRequest,
    requestAttribute: string,
  ): Optional<FilledCallback> {
    const defaults = this.resolveDefaultValue(request);
    const shouldSetDefaults =
      request.isCreateOrAttachRequest() &&
      Array.isArray(defaults) &&
      defaults.length > 0;

    if (request.exists(requestAttribute) || shouldSetDefaults) {
      return async (request, model) => {
        await request
          .resource()
          .authorizeTo(request, Ability.toggleAttachment, [
            this.relatedResource,
          ]);
        // first we clear old attachments
        await this.clearAttachments(request, model);
        // then fill with new attachments
        const repository = this.pivotResource.resolveRepository(request);
        const attachments = await this.prepareAttachments(
          request,
          model,
          requestAttribute,
        );

        await Promise.all(
          attachments.map((pivot) => {
            return repository.store(
              pivot.setAttribute(
                this.resourceForeignKeyName(request),
                model.getAttribute(this.resourceOwnerKeyName(request)),
              ),
            );
          }),
        );
      };
    }
  }

  /**
   * Detach all related models.
   */
  protected async clearAttachments(
    request: AvonRequest,
    resource: Model,
  ): Promise<AnyValue> {
    const detaches = await this.pivotResource
      .resolveRepository(request)
      .where({
        key: this.resourceForeignKeyName(request),
        value: resource.getAttribute(this.ownerKeyName(request)),
        operator: Operator.eq,
      })
      .all();

    return Promise.all(
      detaches.map((pivot) => {
        return this.pivotResource
          .resolveRepository(request)
          .delete(pivot.getKey());
      }),
    );
  }

  protected async allowedDetachments(request: AvonRequest, model: Model) {
    return this.pivotResource
      .resolveRepository(request)
      .where({
        key: this.resourceForeignKeyName(request),
        value: model.getAttribute(this.ownerKeyName(request)),
        operator: Operator.eq,
      })
      .all();
  }

  public async prepareAttachments(
    request: AvonRequest,
    resource: Model,
    requestAttribute: string,
  ): Promise<Model[]> {
    return this.fillPivotFromRequest(
      request,
      requestAttribute,
      await this.filterAllowedAttachments(
        request,
        resource,
        this.getAttachments(request, requestAttribute),
      ),
    );
  }

  protected getAttachments(
    request: AvonRequest,
    requestAttribute: string,
  ): Attachable[] {
    return request
      .array(requestAttribute, this.resolveDefaultValue(request))
      .map((attachment) => {
        return typeof attachment === 'object' ? attachment : { id: attachment };
      });
  }

  /**
   * Filter attachments by policy.
   */
  protected async filterAllowedAttachments(
    request: AvonRequest,
    model: Model,
    attachments: Attachable[],
  ): Promise<Attachable[]> {
    const relatables = await this.getRelatedResources(
      request,
      attachments.map(({ id }) => id),
    );

    return attachments.filter((attachment) => {
      return relatables.find(
        (relatable) => relatable.getKey() === attachment.id,
      );
    });
  }

  protected async getRelatedResources(
    request: AvonRequest,
    resourceIds: Array<PrimaryKey>,
  ) {
    const relatedResources = await this.relatedResource
      .resolveRepository(request)
      .whereKeys(resourceIds)
      .all();

    return this.sanitizeCallback.apply(this, [request, relatedResources]);
  }

  public sanitizeUsing(sanitizeCallback: SanitizeCallback) {
    this.sanitizeCallback = sanitizeCallback;

    return this;
  }

  /**
   * Fill pivot models.
   */
  fillPivotFromRequest(
    request: AvonRequest,
    requestAttribute: string,
    attachments: Attachable[],
  ) {
    const pivotFields = this.pivotFields(request);
    // fill pivot fields
    return attachments.map((related, index: number) => {
      const model = this.pivotResource.resolveRepository(request).model();

      model.setAttribute(this.foreignKeyName(request), related.id);

      pivotFields.forEach((field) => {
        field.fillInto(
          request,
          model,
          field.attribute,
          `${requestAttribute}.${index}.${field.attribute}`,
        );
      });

      return model;
    });
  }

  /**
   * Resolve related value for given resources.
   */
  async resolveRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<AnyValue> {
    const relatables = await this.searchRelatables(request, resources);
    const foreignKeyName = this.resourceForeignKeyName(request);
    const ownerKeyName = this.resourceOwnerKeyName(request);

    resources.forEach((resource) => {
      resource.setAttribute(
        this.attribute,
        relatables.filter((relatable) => {
          const pivot = relatable.getAttribute<AnyRecord>('pivot');

          return (
            pivot.getAttribute(foreignKeyName) ===
            resource.getAttribute(ownerKeyName)
          );
        }),
      );
    });
  }

  /**
   * Get related models for given resources.
   */
  public async searchRelatables(
    request: AvonRequest,
    resources: Model[],
  ): Promise<Model[]> {
    const pivots = await this.getPivotModels(request, resources);
    const relatedModels = await this.getRelatedModels(request, pivots);

    return pivots
      .map((pivot) => {
        const resource = relatedModels.find((related) => {
          return (
            String(related.getAttribute(this.ownerKeyName(request))) ===
            String(pivot.getAttribute(this.foreignKeyName(request)))
          );
        });

        return this.relatedResource
          .resolveRepository(request)
          .fillModel({ ...resource?.getAttributes(), pivot });
      })
      .filter((resource) => resource.getKey());
  }

  /**
   * Get pivot records for given resources.
   */
  protected async getPivotModels(
    request: AvonRequest,
    resources: Model[],
  ): Promise<Model[]> {
    const resourceIds = resources
      .map((resource) => {
        return resource.getAttribute(this.resourceOwnerKeyName(request));
      })
      .filter((value) => value);

    const repository = this.pivotResource.resolveRepository(request).where({
      key: this.resourceForeignKeyName(request),
      value: resourceIds,
      operator: Operator.in,
    });
    // apply custom query callback
    this.pivotQueryCallback.apply(this, [request, repository]);

    return repository.all();
  }

  /**
   * Get pivot records for given resources.
   */
  protected async getRelatedModels(
    request: AvonRequest,
    pivots: Model[],
  ): Promise<Model[]> {
    const repository = this.relatedResource.resolveRepository(request).where({
      key: this.ownerKeyName(request),
      value: pivots.map((pivot) => {
        return pivot.getAttribute(this.foreignKeyName(request));
      }),
      operator: Operator.in,
    });

    const query =
      this.relatableQueryCallback.apply(repository, [request, repository]) ??
      repository;

    return query.all();
  }

  /**
   * Format the given related resource.
   */
  public formatRelatedResource(
    request: AvonRequest,
    resource: Model & { pivot?: Model },
  ): AnyRecord {
    const formattedResource = super.formatRelatedResource(request, resource);
    const pivotFields = this.pivotFields(request);

    if (pivotFields.length === 0 || resource.pivot === undefined) {
      return formattedResource;
    }

    return {
      ...formattedResource,
      ...new FieldCollection(this.pivotFields(request))
        .resolve(resource.pivot)
        .fieldValues(request),
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected responseSchema(request: AvonRequest): OpenApiSchema {
    const fields = new FieldCollection([
      ...this.schemaFields(request),
      ...this.pivotFields(request),
    ]);

    return {
      ...super.responseSchema(request),
      type: 'array',
      default: [fields.fieldValues(request)],
      items: { type: 'object', properties: fields.responseSchemas(request) },
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    return {
      ...this.baseSchema(request),
      description: `use the "associable/${this.attribute}" to retrieve data`,
      type: 'array',
      items:
        this.pivotFields(request).length > 0
          ? {
              type: 'object',
              properties: {
                ...this.pivotSchema(request),
                id: { $ref: '#components/schemas/PrimaryKey' },
              },
            }
          : { $ref: '#components/schemas/PrimaryKey' },
    };
  }

  /**
   * Get the pivot fields swagger-ui schema.
   */
  protected pivotSchema(request: AvonRequest) {
    return new FieldCollection(this.pivotFields(request)).payloadSchemas(
      request,
    );
  }

  /**
   * Get the value considered as null.
   */
  public nullValue(): AnyValue {
    return [];
  }

  /**
   * Determine field is filterable or not.
   */
  public isFilterable(): boolean {
    return false;
  }
}
