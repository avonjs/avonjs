import Joi, { AnySchema } from 'joi';
import { OpenAPIV3 } from 'openapi-types';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import AuthorizedToSee from '../Mixins/AuthorizedToSee';
import Filterable from '../Mixins/Filterable';
import Nullable from '../Mixins/Nullable';
import Orderable from '../Mixins/Orderable';
import Presentable from '../Mixins/Presentable';
import Ordering from './Orderings/Ordering';
import {
  ParameterSerializable,
  FieldSchema,
  FillCallback,
  ResolveCallback,
  Model,
  DefaultCallback,
  OrderingCallback,
  Direction,
  Rules,
  NullableCallback,
  FilterableCallback,
  SeeCallback,
  ResourceEvaluatorCallback,
  EvaluatorCallback,
  FilledCallback,
  OpenApiFieldSchema,
  OpenApiSchema,
} from '../Contracts';
import TextFilter from './Filters/TextFilter';
import { Repository } from '../Repositories';

export default abstract class Field
  extends Nullable(
    Filterable(Orderable(Presentable(AuthorizedToSee(class {})))),
  )
  implements FieldSchema, ParameterSerializable
{
  /**
   * The attribute / column name of the field.
   */
  public attribute: string;

  /**
   * The validation attribute for the field.
   */
  public validationAttribute?: string;

  /**
   * The field's resolved value.
   */
  public value?: any;

  /**
   * The callback to be used to hydrate the model attribute.
   */
  public fillCallback?: FillCallback;

  /**
   * The callback to be used to resolve the field's display value.
   */
  public displayCallback: ResolveCallback = (
    value: any,
    resource: Model,
    attribute: string,
  ) => value;

  /**
   * The callback to be used to resolve the field's value.
   */
  public resolveCallback: ResolveCallback = (
    value: any,
    resource: Model,
    attribute: string,
  ) => value;

  /**
   * The callback to be used for the field's default value.
   */
  public defaultCallback: DefaultCallback = () => this.nullValue();

  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema: AnySchema = Joi.any();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema: AnySchema = Joi.any();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema: AnySchema = Joi.any();

  /**
   * The help text for the field.
   */
  protected helpText?: string;

  /**
   * Custom label for the field.
   */
  protected name?: string;

  /**
   * Define the default orderable callback.
   */
  public defaultOrderingCallback(): OrderingCallback {
    return (
      request: AvonRequest,
      repository: Repository<Model>,
      direction: any,
    ) => {
      repository.order({
        key: this.orderableAttribute(request),
        direction: Direction.ASC === direction ? Direction.ASC : Direction.DESC,
      });
    };
  }

  constructor(attribute: string, resolveCallback?: ResolveCallback) {
    super();
    this.attribute = attribute;

    if (resolveCallback !== undefined) {
      this.resolveCallback = resolveCallback;
    }
  }

  /**
   * Resolve the field's value for display.
   */
  public resolveForDisplay(resource: Model, attribute?: string): any {
    this.resolve(resource, attribute);
  }

  /**
   * Resolve the field's value.
   */
  public resolve(resource: Model, attribute?: string): any {
    const resolveAttribute = attribute ?? this.attribute;

    this.setValue(
      this.resolveCallback(
        this.resolveAttribute(resource, resolveAttribute),
        resource,
        resolveAttribute,
      ),
    );
  }

  /**
   * Resolve the given attribute from the given resource.
   */
  protected resolveAttribute(resource: Model, attribute: string): any {
    return resource.getAttribute(attribute);
  }

  /**
   * Set the callback to be used for determining the field's default value.
   */
  public default(callback: DefaultCallback): this {
    this.defaultCallback = callback;

    return this;
  }

  /**
   * Resolve the default value for the field.
   */
  public resolveDefaultValue(request: AvonRequest): any {
    if (
      request.isCreateOrAttachRequest() ||
      request.isActionRequest() ||
      request.isSchemaRequest()
    ) {
      return this.defaultCallback(request);
    }
  }

  /**
   * Define the callback that should be used to display the field's value.
   */
  public displayUsing(displayCallback: ResolveCallback): this {
    this.displayCallback = displayCallback;

    return this;
  }

  /**
   * Define the callback that should be used to resolve the field's value.
   */
  public resolveUsing(resolveCallback: ResolveCallback): this {
    this.resolveCallback = resolveCallback;

    return this;
  }

  /**
   * Specify a callback that should be used to hydrate the model attribute for the field.
   */
  public fillUsing(fillCallback: FillCallback): this {
    this.fillCallback = fillCallback;

    return this;
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fill<TModel extends Model>(request: AvonRequest, model: TModel): any {
    return this.fillInto(request, model, this.attribute);
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fillForAction<TModel extends Model>(
    request: AvonRequest,
    model: TModel,
  ): any {
    return this.fill(request, model);
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fillInto<TModel extends Model>(
    request: AvonRequest,
    model: TModel,
    attribute: string,
    requestAttribute?: string,
  ): any {
    return this.fillAttribute(
      request,
      requestAttribute ?? this.attribute,
      model,
      attribute,
    );
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  protected fillAttribute<TModel extends Model>(
    request: AvonRequest,
    requestAttribute: string,
    model: TModel,
    attribute: string,
  ): any {
    if (this.fillCallback !== undefined) {
      return this.fillCallback(request, model, attribute, requestAttribute);
    } else {
      return this.fillAttributeFromRequest(
        request,
        requestAttribute,
        model,
        attribute,
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
      attribute,
      this.isValidNullValue(value) ? this.nullValue() : value,
    );
  }

  /**
   * Get the value considered as null.
   */
  public nullValue(): any {
    return null;
  }

  /**
   * Set the value for the field.
   */
  public setValue(value: any): this {
    this.value = value;

    return this;
  }

  /**
   * Mutate the field value for response.
   */
  public abstract getMutatedValue(request: AvonRequest, value: any): any;

  /**
   * Set the validation rules for the field.
   */
  public rules(rules: AnySchema): this {
    this.rulesSchema = rules;

    return this;
  }

  /**
   * Get the validation rules for this field.
   */
  public getRules(request: AvonRequest): Rules {
    return { [this.attribute]: this.rulesSchema };
  }

  /**
   * Get the creation rules for this field.
   */
  public getCreationRules(request: AvonRequest): Rules {
    const rules = this.getRules(request);

    return {
      ...rules,
      [this.attribute]: rules[this.attribute].concat(this.creationRulesSchema),
    };
  }

  /**
   * Set the creation validation rules for the field.
   */
  public creationRules(rules: AnySchema): this {
    this.creationRulesSchema = rules;

    return this;
  }

  /**
   * Get the update rules for this field.
   */
  public getUpdateRules(request: AvonRequest): Rules {
    const rules = this.getRules(request);

    return {
      ...rules,
      [this.attribute]: rules[this.attribute].concat(this.updateRulesSchema),
    };
  }

  /**
   * Set the creation validation rules for the field.
   */
  public updateRules(rules: AnySchema): this {
    this.updateRulesSchema = rules;

    return this;
  }

  /**
   * Get the validation attribute for the field.
   */
  public getValidationAttribute(request: AvonRequest): string | undefined {
    return this.validationAttribute;
  }

  /**
   * Get field validator.
   */
  public validator(): typeof Joi {
    return Joi;
  }

  /**
   * Determine if the field is required.
   */
  public isRequired(request: AvonRequest): boolean {
    if (
      request.isResourceIndexRequest() ||
      request.isActionRequest() ||
      request.isCreateOrAttachRequest()
    ) {
      return this.isRequiredForCreation(request);
    }

    if (request.isUpdateOrUpdateAttachedRequest()) {
      return this.isRequiredForUpdate(request);
    }

    return false;
  }

  /**
   * Determine if the field is required for creation.
   */
  public isRequiredForCreation(request: AvonRequest): boolean {
    const rules = this.getCreationRules(request)[this.attribute];

    return rules.$_getFlag('presence') === 'required';
  }

  /**
   * Determine if the field is required for update.
   */
  public isRequiredForUpdate(request: AvonRequest): boolean {
    const rules = this.getUpdateRules(request)[this.attribute];

    return rules.$_getFlag('presence') === 'required';
  }

  /**
   * Define filterable attribute.
   */
  public filterableAttribute(request: AvonRequest): string {
    return this.attribute;
  }

  /**
   * Define orderable attribute.
   */
  public orderableAttribute(request: AvonRequest): string {
    return this.attribute;
  }

  /**
   * Determine field is fillable or not.
   */
  public fillable(): boolean {
    return true;
  }

  /**
   * Determine field is resolvable or not.
   */
  public resolvable(): boolean {
    return true;
  }

  /**
   * Specify the field help text.
   */
  public help(helpText: string): this {
    this.helpText = helpText;

    return this;
  }

  /**
   * Specify the field label.
   */
  public withName(name: string): this {
    this.name = name;

    return this;
  }

  /**
   * Determine if the element should be displayed for the given request.
   */
  public authorize(request: AvonRequest): boolean {
    return this.authorizedToSee(request);
  }

  /**
   * Make the field filter.
   */
  public makeFilter(request: AvonRequest): Filter {
    return new TextFilter(this);
  }

  /**
   * Make the field filter.
   */
  public makeOrdering(request: AvonRequest): Ordering {
    return new Ordering(this);
  }

  /**
   * Indicate that the field should be nullable.
   */
  public nullable(
    nullable: boolean = true,
    validator?: NullableCallback,
  ): this {
    super.nullable(nullable, validator);

    if (nullable) {
      this.rules(this.rulesSchema.allow(null));
    } else {
      this.required();
    }

    return this;
  }

  /**
   * Determine that the field should be filled in the request.
   */
  public required(): this {
    this.rules(this.rulesSchema.required());

    return this;
  }

  /**
   * Get the value for the field.
   */
  public getValue(request: AvonRequest): any {
    if (this.value === undefined) {
      this.value = this.resolveDefaultValue(request);
    }

    const value =
      this.value !== undefined && !this.isValidNullValue(this.value) // ![undefined, this.nullValue()].includes(this.value)
        ? this.getMutatedValue(request, this.value)
        : this.nullValue();

    return value ?? this.nullValue();
  }

  /**
   * Get the swagger-ui schema.
   */
  schema(request: AvonRequest): OpenApiFieldSchema {
    return {
      payload: this.payloadSchema(request),
      response: this.responseSchema(request),
    };
  }

  /**
   * Get the swagger-ui schema.
   */
  protected payloadSchema(request: AvonRequest): OpenApiSchema {
    return this.baseSchema(request);
  }

  /**
   * Get the swagger-ui schema.
   */
  protected responseSchema(request: AvonRequest): OpenApiSchema {
    return this.baseSchema(request);
  }

  /**
   * Get the base swagger-ui schema.
   */
  protected baseSchema(request: AvonRequest): OpenApiSchema {
    return {
      type: 'string',
      nullable: this.isNullable(),
      description: this.helpText,
      title: this.name ?? this.attribute,
      default: this.resolveDefaultValue(request),
    };
  }

  /**
   * Serialize parameters for schema.
   */
  public serializeParameters(
    request: AvonRequest,
  ): OpenAPIV3.ParameterObject[] {
    return [
      {
        name: this.attribute,
        in: 'body',
        schema: this.schema(request).payload,
      },
    ];
  }

  /**
   * Determine field is filterable or not.
   */
  public abstract isFilterable(): boolean;

  /**
   * Determine field is orderable or not.
   */
  public abstract isOrderable(): boolean;

  public filterable(callback?: FilterableCallback | undefined): this {
    return super.filterable(callback);
  }

  public orderable(callback?: OrderingCallback | undefined): this {
    return super.orderable(callback);
  }

  public canSee(callback: SeeCallback): this {
    return super.canSee(callback);
  }

  public hideFromIndex(callback?: boolean | ResourceEvaluatorCallback): this {
    return super.hideFromIndex(callback);
  }

  public hideFromDetail(callback?: boolean | ResourceEvaluatorCallback): this {
    return super.hideFromDetail(callback);
  }

  public hideWhenCreating(callback?: boolean | EvaluatorCallback): this {
    return super.hideWhenCreating(callback);
  }

  public hideWhenUpdating(
    callback?: boolean | ResourceEvaluatorCallback,
  ): this {
    return super.hideWhenUpdating(callback);
  }

  public showOnIndex(callback?: boolean | ResourceEvaluatorCallback): this {
    return super.showOnIndex(callback);
  }

  public showOnDetail(callback?: boolean | ResourceEvaluatorCallback): this {
    return super.showOnDetail(callback);
  }

  public showOnCreating(callback?: boolean | EvaluatorCallback): this {
    return super.showOnCreating(callback);
  }

  public showOnUpdating(callback?: boolean | ResourceEvaluatorCallback): this {
    return super.showOnUpdating(callback);
  }

  public onlyOnIndex(): this {
    return super.onlyOnIndex();
  }

  public onlyOnDetail(): this {
    return super.onlyOnDetail();
  }

  public onlyOnForms(): this {
    return super.onlyOnForms();
  }

  public exceptOnForms(): this {
    return super.exceptOnForms();
  }
}
