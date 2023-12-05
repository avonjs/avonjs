import Joi from 'joi';
import { OpenAPIV3 } from 'openapi-types';
import FieldCollection from '../Collections/FieldCollection';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Ability, FilledCallback, Model, Operator, Rules } from '../contracts';
import Field from './Field';
import Relation from './Relation';

export default class BelongsTo extends Relation {
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

    return async (request, model) => {
      await request
        .newResource(model)
        .authorizeTo(request, Ability.add, [
          await this.getRelatedResource(request, value),
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
    return await this.relatedResource
      .repository()
      .where({
        key: this.ownerKeyName(request),
        value: resources
          .map((resource) => {
            return resource.getAttribute(this.foreignKeyName(request));
          })
          .filter((value) => value),
        operator: Operator.in,
      })
      .all();
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
   * Get the validation rules for this field.
   */
  public getRules(request: AvonRequest): Rules {
    return {
      [this.attribute]: Joi.any().external(async (value, helpers) => {
        if (this.isValidNullValue(value)) {
          return;
        }

        if ((await this.getRelatedResource(request, value)) === undefined) {
          return helpers.error('any.invalid', {
            message: 'Resource not found',
          });
        }
      }),
    };
  }

  protected async getRelatedResource(
    request: AvonRequest,
    id: string | number,
  ) {
    return this.relatedResource
      .repository()
      .where({
        key: this.ownerKeyName(request),
        operator: Operator.eq,
        value: id,
      })
      .first();
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(
    request: AvonRequest,
  ): OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject {
    const schema = super.schema(request) as OpenAPIV3.SchemaObject;

    if (this.isLoaded()) {
      const fields = new FieldCollection(this.relatableFields(request));
      schema.type = 'object';
      schema.properties = fields.mapWithKeys((field: Field) => [
        field.attribute,
        field.schema(request),
      ]) as Record<string, OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject>;
      schema.default = fields.mapWithKeys((field: Field) => [
        field.attribute,
        field.getValue(request),
      ]) as Record<string, any>;
    } else {
      schema.type = 'string';
    }

    return schema;
  }
}
