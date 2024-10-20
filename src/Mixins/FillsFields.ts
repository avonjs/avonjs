import type FieldCollection from '../Collections/FieldCollection';
import type {
  AbstractMixable,
  CallbackStack,
  FilledCallback,
  Model,
} from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class FillsFields extends Parent {
    /**
     * Fill a new model instance using the given request.
     */
    public fillForCreation<TModel extends Model>(
      request: AvonRequest,
      model: TModel,
    ): CallbackStack {
      return this.fillFields<TModel>(
        request,
        model,
        request
          .newResource(model)
          .creationFields(request)
          .withoutUnfillableFields(),
      );
    }

    /**
     * Fill a new model instance using the given request.
     */
    public fillForUpdate<TModel extends Model>(
      request: AvonRequest,
      model: TModel,
    ): CallbackStack {
      return this.fillFields<TModel>(
        request,
        model,
        request
          .newResource(model)
          .updateFields(request)
          .withoutUnfillableFields(),
      );
    }

    /**
     * Fill the given fields for the model.
     */
    public fillFields<TModel extends Model>(
      request: AvonRequest,
      model: TModel,
      fields: FieldCollection,
    ): CallbackStack {
      return [
        model,
        fields
          .map((field) => field.fill(request, model))
          .filter((callback: unknown) => typeof callback === 'function')
          .values()
          .all() as Array<FilledCallback>,
      ];
    }
  }

  return FillsFields;
};
