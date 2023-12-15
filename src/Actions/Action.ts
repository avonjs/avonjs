import Joi, { AnySchema } from 'joi';
import FieldCollection from '../Collections/FieldCollection';
import ValidationException from '../Exceptions/ValidationException';
import { Field } from '../Fields';
import ActionRequest from '../Http/Requests/ActionRequest';
import AvonRequest from '../Http/Requests/AvonRequest';
import AuthorizedToSee from '../Mixins/AuthorizedToSee';
import { Fluent } from '../Models';
import {
  HasSchema,
  RunCallback,
  Model,
  SerializedAction,
  BulkActionResult,
  OpenApiSchema,
  SeeCallback,
} from '../contracts';
import { AvonResponse, SuccessfulResponse } from '../Http/Responses';
import Avon from '../Avon';

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
  public standaloneAction: boolean = false;

  /**
   * Execute the action for the given request.
   */
  public async handleRequest(request: ActionRequest): Promise<AvonResponse> {
    // prepare changes for log
    const changes = this.getChanges(request, await this.getModels(request));
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
  protected async getModels(request: ActionRequest) {
    return (this.isStandalone() ? [] : await request.models()).filter((model) =>
      this.authorizedToRun(request, model),
    );
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
        previous: request.newModel({ ...resource.all() }),
      };
    });
  }

  /**
   * Resolve the creation fields.
   */
  public resolveFields(request: AvonRequest): Fluent {
    const model = new Fluent();

    this.availableFields(request).authorized(request).resolve(model);

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
  ): Promise<AvonResponse | void>;

  /**
   * Determine if the action is executable for the given request.
   */
  public authorizedToRun(request: AvonRequest, model: Model): boolean {
    return this.runCallback != null
      ? this.runCallback.apply(this, [request, model])
      : true;
  }

  /**
   * Validate an action for incoming request.
   *
   * @throws {ValidationException}
   */
  public async validate(request: AvonRequest): Promise<any> {
    await this.validator(request)
      .validateAsync(request.all(), { abortEarly: false, allowUnknown: true })
      .then((value) => {
        this.afterValidation(request, value);
      })
      .catch((error) => {
        ValidationException.throw(error);
      });
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
      this.availableFields(request)
        .mapWithKeys<AnySchema>((field: Field) => {
          return field.getCreationRules(request);
        })
        .all(),
    );
  }

  /**
   * Perform any final formatting of the given validation rules.
   */
  protected formatRules(request: AvonRequest, rules: AnySchema[]): AnySchema[] {
    return rules;
  }

  /**
   * Handle any post-validation processing.
   */
  protected afterValidation(request: AvonRequest, validator: any): any {
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
   * Determine if the action is a standalone action.
   *
   * @return bool
   */
  public isStandalone(): boolean {
    return this.standaloneAction;
  }

  /**
   * Prepare the action for JSON serialization.
   */
  public serializeForIndex(request: ActionRequest): SerializedAction {
    return {
      uriKey: this.uriKey(),
      isStandalone: this.isStandalone(),
      fields: this.availableFields(request)
        .mapWithKeys((field: Field) => [field.attribute, field])
        .all() as object[],
    };
  }

  /**
   * Get successful response.
   */
  public respondSuccess(): AvonResponse {
    return new SuccessfulResponse();
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
}
