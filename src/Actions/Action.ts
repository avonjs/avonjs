import collect from 'collect.js';
import Joi, { ValidationError, type AnySchema } from 'joi';
import type { OpenAPIV3 } from 'openapi-types';
import Avon from '../Avon';
import FieldCollection from '../Collections/FieldCollection';
import type {
  AnyValue,
  BulkActionResult,
  HasSchema,
  Model,
  Nullable,
  OpenApiSchema,
  Optional,
  Rules,
  RunCallback,
  SeeCallback,
  SerializedAction,
  UnknownRecord,
} from '../Contracts';
import { ForbiddenException } from '../Exceptions';
import ValidationException from '../Exceptions/ValidationException';
import type { Field } from '../Fields';
import type ActionRequest from '../Http/Requests/ActionRequest';
import type AvonRequest from '../Http/Requests/AvonRequest';
import { AvonResponse } from '../Http/Responses';
import ActionResponse from '../Http/Responses/ActionResponse';
import AuthorizedToSee from '../Mixins/AuthorizedToSee';
import { Fluent } from '../Models';

export default abstract class Action
  extends AuthorizedToSee(class {})
  implements HasSchema
{
  /**
   * The callback used to authorize running the action.
   */
  public runCallback?: RunCallback;

  /**
   * Indicates if the action can be run without any models.
   */
  public standaloneAction = false;

  /**
   * Indicates if the action can be run on a single model.
   */
  public inlineAction = false;

  /**
   * Indicates if the action destroy some resources.
   */
  public destructiveAction = false;

  /**
   * Indicates the response status code.
   */
  protected responseCode = 200;

  /**
   * Indicates the response content type.
   */
  protected responseType = 'application/json';

  /**
   * Execute the action for the given request.
   */
  public async handleRequest(request: ActionRequest): Promise<AvonResponse> {
    const models = await this.resolveModels(request);
    // Authorize action
    await this.authorizeAction(request, models);
    // prepare changes for log
    const changes = this.getChanges(request, models);
    // handle action
    const results = await this.handle(
      this.resolveFields(request),
      changes.map(({ resource }) => resource),
    );
    // record action changes on the resource
    await this.recordChanges(request, changes);
    // finish!
    return results instanceof AvonResponse ? results : this.respondSuccess();
  }

  /**
   * Get models for incoming action.
   */
  protected async resolveModels(request: ActionRequest) {
    return this.isStandalone() ? [] : request.models();
  }

  /**
   * Authorize models before running action.
   */
  protected async authorizeAction(request: ActionRequest, models: Model[]) {
    try {
      if (this.isStandalone()) {
        await this.authorizeStandaloneAction(request);
      } else if (this.isInline()) {
        await this.authorizeInlineAction(request, models[0]);
      } else {
        await this.authorizeBulkAction(request, models);
      }
    } catch (error) {
      throw this.handleAuthorizationError(error);
    }
  }

  /**
   * Authorize a standalone action.
   */
  protected async authorizeStandaloneAction(
    request: ActionRequest,
  ): Promise<void> {
    const isAuthorized = await this.authorizedToRun(request, null);
    ForbiddenException.unless(isAuthorized, this.unauthorizedMessage());
  }

  /**
   * Authorize an inline action.
   */
  protected async authorizeInlineAction(
    request: ActionRequest,
    model: Model,
  ): Promise<void> {
    const isAuthorized = await this.authorizedToRun(request, model);
    ForbiddenException.unless(isAuthorized, this.unauthorizedMessage());
  }

  /**
   * Authorize a bulk action.
   */
  protected async authorizeBulkAction(
    request: ActionRequest,
    models: Model[],
  ): Promise<void> {
    await this.authorizationValidator(request).validateAsync(models, {
      abortEarly: false,
      allowUnknown: true,
    });
  }

  /**
   * Handle authorization errors.
   */
  protected handleAuthorizationError(error: unknown): Error {
    if (error instanceof ValidationError) {
      return new ValidationException(error);
    }
    return error as Error;
  }

  /**
   * Make Joi validator to authorize the models.
   */
  protected authorizationValidator(request: ActionRequest) {
    return Joi.array().items(
      Joi.any().external(async (model, helpers) => {
        // Authorization check logic (async)
        const isAuthorized = await this.authorizedToRun(request, model);

        if (!isAuthorized) {
          return helpers.error('any.custom', {
            error: new Error(this.unauthorizedMessage(model)),
          });
        }
      }, 'Authorization check'),
    );
  }

  /**
   * Get unauthorized to run message.
   */
  protected unauthorizedMessage(model: Nullable<Model> = null) {
    return model
      ? `unauthorized to run action on resource with ID:'${model.getKey()}'`
      : 'Unauthorized to run action';
  }

  /**
   * Prepare change log for incoming action.
   */
  protected getChanges(
    request: ActionRequest,
    resources: Model[],
  ): BulkActionResult {
    return resources.map((resource) => {
      return {
        resource,
        previous: request.newModel({ ...resource.getAttributes() }),
      };
    });
  }

  /**
   * Resolve the creation fields.
   */
  public resolveFields(request: AvonRequest): Fluent {
    const model = new Fluent();

    this.availableFields(request)
      .authorized(request)
      .each((field) => field.fillForAction(request, model));

    return model;
  }

  /**
   * Store changes for incoming action.
   */
  protected async recordChanges(
    request: ActionRequest,
    changes: BulkActionResult = [],
  ) {
    if (this.isStandalone()) {
      await request
        .resource()
        .recordStandaloneActionEvent(this, request.all(), Avon.userId(request));
    } else {
      await request
        .resource()
        .recordBulkActionEvent(
          this,
          changes,
          request.all(),
          Avon.userId(request),
        );
    }
  }

  /**
   * Perform the action on the given models.
   */
  protected abstract handle(
    fields: Fluent,
    models: Model[],
  ): Promise<Optional<AvonResponse>>;

  /**
   * Determine if the action is executable for the given request.
   */
  public async authorizedToRun(
    request: AvonRequest,
    model: Nullable<Model> = null,
  ) {
    return this.runCallback != null
      ? this.runCallback.apply(this, [request, model])
      : true;
  }

  /**
   * Validate an action for incoming request.
   *
   * @throws {ValidationException}
   */
  public async validate(request: AvonRequest): Promise<void> {
    try {
      const value = await this.validator(request).validateAsync(
        this.dataForValidation(request),
        { abortEarly: false, allowUnknown: true },
      );

      this.afterValidation(request, value);
    } catch (error) {
      throw new ValidationException(error as ValidationError);
    }
  }

  /**
   * Create a validator instance for a resource creation request.
   */
  public validator(request: AvonRequest): Joi.AnySchema {
    return Joi.object(this.rules(request));
  }

  /**
   * Get the validation rules for a resource creation request.
   */
  public rules(request: AvonRequest): AnySchema[] {
    return this.formatRules(
      request,
      this.prepareRulesForValidator(
        this.availableFields(request)
          .flatMap((field) => field.getCreationRules(request))
          .all(),
      ),
    );
  }

  /**
   * Prepare given rules for validator.
   */
  public prepareRulesForValidator(rules: Rules[]): AnySchema[] {
    return collect(rules)
      .flatMap((rules) => Object.keys(rules).map((key) => [key, rules[key]]))
      .mapWithKeys<AnySchema>((rules: [string, AnySchema]) => rules)
      .all();
  }

  /**
   * Perform any final formatting of the given validation rules.
   */
  protected formatRules(request: AvonRequest, rules: AnySchema[]): AnySchema[] {
    return rules;
  }

  /**
   * Prepare given rules for validator.
   */
  public dataForValidation(request: AvonRequest) {
    return request.all();
  }

  /**
   * Handle any post-validation processing.
   */
  protected afterValidation(
    request: AvonRequest,
    validator: AnyValue,
  ): AnyValue {
    //
  }

  /**
   * Get the fields that are available for the given request.
   */
  public availableFields(request: AvonRequest): FieldCollection {
    return new FieldCollection(this.fields(request));
  }

  /**
   * Get the fields available on the action.
   */
  public fields(request: AvonRequest): Field[] {
    return [];
  }

  /**
   * Set the callback to be run to authorize running the action.
   */
  public canRun(callback?: RunCallback): this {
    this.runCallback = callback;

    return this;
  }

  /**
   * Set the callback to be run to authorize viewing the filter or action.
   */
  public canSee(callback: SeeCallback): this {
    return super.canSee(callback);
  }

  /**
   * Get the displayable name of the action.
   */
  public name(): string {
    return this.constructor.name;
  }

  /**
   * Get the URI key for the action.
   */
  public uriKey(): string {
    return this.name().replace(
      /[A-Z]/g,
      (matched, offset) => (offset > 0 ? '-' : '') + matched.toLowerCase(),
    );
  }

  /**
   * Mark the action as a standalone action.
   *
   * @return this
   */
  public standalone(): this {
    this.standaloneAction = true;

    return this;
  }

  /**
   * Determine if the action is a "standalone" action.
   *
   * @return bool
   */
  public isStandalone(): boolean {
    return this.standaloneAction;
  }

  /**
   * Mark the action as a "inline" action.
   *
   * @return this
   */
  public inline(): this {
    this.inlineAction = true;

    return this;
  }

  /**
   * Determine if the action is a "inline" action.
   *
   * @return bool
   */
  public isInline(): boolean {
    return this.inlineAction;
  }

  /**
   * Mark the action as a "destructive" action.
   *
   * @return this
   */
  public destructive(): this {
    this.destructiveAction = true;

    return this;
  }

  /**
   * Determine if the action is a "destructive" action.
   *
   * @return bool
   */
  public isDestructive(): boolean {
    return this.destructiveAction;
  }

  /**
   * Prepare the action for JSON serialization.
   */
  public serializeForIndex(request: ActionRequest): SerializedAction {
    return {
      uriKey: this.uriKey(),
      isStandalone: this.isStandalone(),
      isInline: this.isInline(),
      fields: this.availableFields(request)
        .mapWithKeys((field: Field) => [field.attribute, field])
        .all() as object[],
    };
  }

  /**
   * Get successful response.
   */
  public respondSuccess(data?: UnknownRecord): AvonResponse {
    return new ActionResponse(
      data ?? { message: 'Your action successfully ran.' },
      { message: 'Your action successfully ran.' },
    );
  }

  /**
   * Get the swagger-ui response schema.
   */
  public responseSchema(request: AvonRequest): OpenAPIV3.ResponsesObject {
    return {
      [this.responseCode]: {
        description: `Action ${this.name()} ran successfully`,
        content: {
          [this.responseType]: {
            schema: {
              type: 'object',
              properties: {
                code: { type: 'number', default: this.responseCode },
                data: this.schema(request),
                meta: {
                  type: 'object',
                  properties: {
                    message: {
                      type: 'string',
                      default: 'Your action ran successfully.',
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  public schema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          default: 'Your action ran successfully.',
        },
      },
    };
  }

  /**
   * Get the swagger-ui possible request body contents.
   */
  public accepts(): string[] {
    return ['application/json', 'multipart/form-data'];
  }
}
