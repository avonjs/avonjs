import Joi from 'joi';
import Avon from '../Avon';
import { RuntimeException } from '../Exceptions';
import AvonRequest from '../Http/Requests/AvonRequest';
import Resource from '../Resource';
import {
  PivotFieldCallback,
  Rules,
  Operator,
  Model,
  Attachable,
  Ability,
  FilledCallback,
  OpenApiSchema,
} from '../Contracts';
import Relation from './Relation';
import { guessForeignKey } from './ResourceRelationshipGuesser';
import FieldCollection from '../Collections/FieldCollection';
import Field from './Field';

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

  constructor(resource: string, pivot: string, attribute?: string) {
    super(resource);

    this.pivotResource = this.getPivotResource(pivot);
    this.attribute = attribute ?? resource;

    this.nullable(true, (value) => !Array.isArray(value) || value.length === 0);
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
    return async (value, helpers) => {
      if (this.isNullable() && (!Array.isArray(value) || value.length === 0)) {
        return;
      }

      const related = await this.relatedResource
        .repository()
        .where({
          key: this.ownerKeyName(request),
          operator: Operator.eq,
          value,
        })
        .first();

      if (related === undefined) {
        return helpers.error('any.invalid', {
          message: 'Related resource not exists',
          label: 'Related resource not exists',
          value,
        });
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
  ): any {}

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

    return async () => {
      // first we clear old attachments
      await this.clearAttachments(request, model);
      // then fill with new attachments
      const repository = this.pivotResource.repository();
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

  /**
   * Detach all related models.
   */
  protected async clearAttachments(
    request: AvonRequest,
    resource: Model,
  ): Promise<any> {
    const allowedDetachments = await this.allowedDetachments(request, resource);

    await Promise.all(
      allowedDetachments.map((relatedResource) => {
        return this.pivotResource.repository().delete(relatedResource.getKey());
      }),
    );
  }

  protected async allowedDetachments(request: AvonRequest, model: Model) {
    const authorizedResources = [];
    const resource = request.newResource(model);
    const relatedResources = await this.pivotResource
      .repository()
      .where({
        key: this.foreignKeyName(request),
        value: model.getAttribute(this.ownerKeyName(request)),
        operator: Operator.eq,
      })
      .all();

    for (const related of relatedResources) {
      if (await resource.authorizedTo(request, Ability.detach, [related])) {
        authorizedResources.push(related);
      }
    }

    return authorizedResources;
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
    return request.array(requestAttribute).map((attachment) => {
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
    const authorizedResources: Attachable[] = [];
    const resource = request.newResource(model);
    const relatables = await this.getRelatedResources(
      attachments.map(({ id }) => id),
    );

    for (const attachment of attachments) {
      const relatable = relatables.find(
        (relatable) => relatable.getKey() === attachment.id,
      )!;
      if (await resource.authorizedTo(request, Ability.attach, [relatable])) {
        authorizedResources.push(attachment);
      }
    }

    return authorizedResources;
  }

  protected async getRelatedResources(resourceIds: Array<string | number>) {
    return this.relatedResource.repository().whereKeys(resourceIds).all();
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
      const model = this.pivotResource.repository().model();

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
  ): Promise<any> {
    const relatables = await this.searchRelatables(request, resources);
    const foreignKeyName = this.resourceForeignKeyName(request);
    const ownerKeyName = this.resourceOwnerKeyName(request);

    resources.forEach((resource) => {
      resource.setAttribute(
        this.attribute,
        relatables.filter((relatable) => {
          const pivot = relatable.getAttribute('pivot');

          return pivot[foreignKeyName] === resource.getAttribute(ownerKeyName);
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
    const foreignKey = this.foreignKeyName(request);
    const ownerKey = this.ownerKeyName(request);
    const pivots = await this.pivotResource
      .repository()
      .where({
        key: this.resourceForeignKeyName(request),
        value: resources
          .map((resource) => {
            return resource.getAttribute(this.resourceOwnerKeyName(request));
          })
          .filter((value) => value),
        operator: Operator.in,
      })
      .all();

    const related = await this.relatedResource
      .repository()
      .where({
        key: ownerKey,
        value: pivots.map((pivot) => pivot.getAttribute(foreignKey)),
        operator: Operator.in,
      })
      .all();

    related.forEach((related) => {
      related.setAttribute(
        'pivot',
        pivots.find((pivot) => {
          return (
            String(pivot.getAttribute(foreignKey)) ===
            String(related.getAttribute(ownerKey))
          );
        }),
      );
    });

    return related;
  }

  /**
   * Format the given related resource.
   */
  public formatRelatedResource(
    request: AvonRequest,
    resource: Model & { pivot?: Model },
  ): Record<string, any> {
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
      type: 'array',
      items: {
        anyOf: [
          { type: 'string' },
          { type: 'number' },
          {
            type: 'object',
            properties: {
              ...new FieldCollection(this.pivotFields(request)).payloadSchemas(
                request,
              ),
              id: { oneOf: [{ type: 'string' }, { type: 'number' }] },
            },
          },
        ],
      },
    };
  }

  /**
   * Get the value considered as null.
   */
  public nullValue(): any {
    return [];
  }

  /**
   * Determine field is filterable or not.
   */
  public isFilterable(): boolean {
    return false;
  }
}
