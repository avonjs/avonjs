import collect from 'collect.js';
import Joi, { type AnySchema, ValidationError } from 'joi';
import type { AbstractMixable, Rules } from '../Contracts';
import ValidationException from '../Exceptions/ValidationException';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type Resource from '../Resource';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class PerformsValidation extends Parent {
    /**
     * Validate a resource creation request.
     *
     * @throws ValidationException
     */
    public async validateForCreation(request: AvonRequest) {
      await this.validatorForCreation(request)
        .validateAsync(this.dataForValidation(request), {
          abortEarly: false,
        })
        .then((value) => this.afterCreationValidation(request, value))
        .catch((error) => {
          if (error instanceof ValidationError) {
            throw new ValidationException(error);
          }

          throw error;
        });
    }

    /**
     * Create a validator instance for a resource creation request.
     */
    public validatorForCreation(request: AvonRequest): AnySchema {
      return Joi.object(this.rulesForCreation(request));
    }

    /**
     * Get the validation rules for a resource creation request.
     */
    public rulesForCreation(request: AvonRequest): AnySchema[] {
      return this.formatRules(
        request,
        this.prepareRulesForValidator(
          request
            .newResource()
            .creationFields(request)
            .flatMap((field) => field.getCreationRules(request))
            .all(),
        ),
      );
    }

    /**
     * Validate a resource update request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public async validateForUpdate(request: AvonRequest, resource?: Resource) {
      await this.validatorForUpdate(request, resource)
        .validateAsync(this.dataForValidation(request), {
          abortEarly: false,
        })
        .then((value) => this.afterUpdateValidation(request, value))
        .catch((error) => {
          if (error instanceof ValidationError) {
            throw new ValidationException(error);
          }

          throw error;
        });
    }

    /**
     * Create a validator instance for a resource update request.
     */
    public validatorForUpdate(
      request: AvonRequest,
      resource?: Resource,
    ): AnySchema {
      return Joi.object(this.rulesForUpdate(request, resource));
    }

    /**
     * Get the validation rules for a resource update request.
     */
    public rulesForUpdate(
      request: AvonRequest,
      resource?: Resource,
    ): AnySchema[] {
      return this.formatRules(
        request,
        this.prepareRulesForValidator(
          (resource ?? request.newResource())
            .updateFields(request)
            .map((field) => field.getUpdateRules(request))
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
    public formatRules(request: AvonRequest, rules: AnySchema[]): AnySchema[] {
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
    public afterValidation(request: AvonRequest, validator: unknown) {
      //
    }

    /**
     * Handle any post-creation validation processing.
     */
    public afterCreationValidation(request: AvonRequest, validator: unknown) {
      //
    }

    /**
     * Handle any post-update validation processing.
     */
    public afterUpdateValidation(request: AvonRequest, validator: unknown) {
      //
    }
  }

  return PerformsValidation;
};
