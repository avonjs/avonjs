import { Model, AbstractMixable } from '../Contracts';
import Repository from '../Repositories/Repository';
import { DateTime } from 'luxon';

export default <
  TModel extends Model,
  TBase extends AbstractMixable<Repository<TModel>>,
>(
  Parent: TBase,
) => {
  abstract class HasTimestamps extends Parent {
    /**
     * Store given model into the storage.
     */
    async store(model: TModel): Promise<TModel> {
      //@ts-ignore
      return super.store(this.fillTimestamps(model));
    }

    /**
     * Update the given model in storage.
     */
    async update(model: TModel): Promise<TModel> {
      //@ts-ignore
      return super.update(this.fillTimestamps(model, [this.getUpdatedAtKey()]));
    }

    /**
     * Fill the timestamps for given attributes.
     */
    public fillTimestamps(model: TModel, attributes?: string[]): TModel {
      const forcedToUpdate = Array.isArray(attributes) && attributes.length > 0;

      (attributes ?? [this.getCreatedAtKey(), this.getUpdatedAtKey()]).forEach(
        (attribute) => {
          if (
            forcedToUpdate ||
            [null, undefined].includes(model.getAttribute(attribute))
          ) {
            model.setAttribute(attribute, this.freshTimestamp());
          }
        },
      );

      return model;
    }

    /**
     * Get name of `created_at` key.
     */
    public getCreatedAtKey(): string {
      return 'created_at';
    }

    /**
     * Get name of `update_at` key.
     */
    public getUpdatedAtKey(): string {
      return 'updated_at';
    }

    /**
     * Get a fresh timestamp for the model.
     */
    public freshTimestamp(): unknown {
      return DateTime.now().toSQL({ includeOffset: false });
    }
  }

  return HasTimestamps;
};
