import {
  type AbstractMixable,
  type Args,
  type Model,
  Operator,
  type SoftDeletes as SoftDeletesContract,
  type Where,
} from '../Contracts';
import ModelNotFoundException from '../Exceptions/ModelNotFoundException';
import type Repository from '../Repositories/Repository';

export default <
  TModel extends Model,
  TBase extends AbstractMixable<Repository<TModel>>,
>(
  Parent: TBase,
) => {
  abstract class SoftDeletes extends Parent {
    constructor(...params: Args) {
      super(params);
      this.applySoftDelete();
    }

    /**
     * Store given model into the storage.
     */
    async store(model: TModel): Promise<TModel> {
      //@ts-ignore
      return super.store(this.ensureOfSoftDeletes(model));
    }

    /**
     * Ensure that "delete at" attribute is set.
     */
    public ensureOfSoftDeletes(model: TModel) {
      return !this.isSoftDeleted(model) ? this.resetSoftDeletes(model) : model;
    }

    /**
     * Delete model for the given key.
     */
    async delete(key: string | number): Promise<void> {
      const model = await this.find(key);

      if (model === undefined) {
        return;
      }

      await this.update(this.fillSoftDeletes(model));
    }

    /**
     * Fill the "deleted at" column.
     */
    public fillSoftDeletes(model: TModel): TModel {
      model.setAttribute(this.getDeletedAtKey(), this.getDeletedAtValue());

      return model;
    }

    /**
     * Reset the "deleted at" column.
     */
    public resetSoftDeletes(model: TModel): TModel {
      model.setAttribute(
        this.getDeletedAtKey(),
        this.getDeletedAtValueOnRestore(),
      );

      return model;
    }

    /**
     * Delete model for the given key.
     */
    async forceDelete(key: string | number): Promise<void> {
      this.removeSoftDeleteQueries();
      //@ts-ignore
      await super.delete(key);
    }

    /**
     * Restore the delete model for given key.
     */
    async restore(key: string | number): Promise<TModel> {
      const model = await this.onlyTrashed().find(key);

      ModelNotFoundException.unless(model);

      return this.update(this.resetSoftDeletes(model));
    }

    /**
     * Apply soft-delete constraint.
     */
    public applySoftDelete(): Repository<TModel> & SoftDeletesContract<TModel> {
      return this.where(this.scopeSoftDelete());
    }

    /**
     * Apply soft-delete constraint.
     */
    public withoutTrashed(): Repository<TModel> & SoftDeletesContract<TModel> {
      return (this.removeSoftDeleteQueries() as SoftDeletes).applySoftDelete();
    }

    /**
     * Ignore soft-delete constraint.
     */
    public withTrashed(): Repository<TModel> & SoftDeletesContract<TModel> {
      return this.removeSoftDeleteQueries();
    }

    /**
     * Apply only trashed record constraints.
     */
    public onlyTrashed(): Repository<TModel> & SoftDeletesContract<TModel> {
      return this.removeSoftDeleteQueries().where(this.scopeTrashedRecords());
    }

    /**
     * Removes all scopes.
     */
    public removeSoftDeleteQueries(): Repository<TModel> &
      SoftDeletesContract<TModel> {
      const softDeletes = JSON.stringify(this.scopeSoftDelete());
      const trashes = JSON.stringify(this.scopeTrashedRecords());

      const repository = this.setWheres(
        this.getWheres().filter((value) => {
          if (JSON.stringify(value) === softDeletes) {
            return false;
          }

          return JSON.stringify(value) !== trashes;
        }),
      );

      return repository;
    }

    /**
     * Get soft-delete constraint.
     */
    public scopeSoftDelete(): Where {
      return {
        key: this.getDeletedAtKey(),
        value: this.getSoftDeleteValue(),
        operator: Operator.eq,
      };
    }

    /**
     * Get only trashed records constraint.
     */
    public scopeTrashedRecords(): Where {
      return {
        key: this.getDeletedAtKey(),
        value: this.getSoftDeleteValue(),
        operator: Operator.not,
      };
    }

    /**
     * Determine whether a given resource is "soft-deleted".
     */
    isSoftDeleted(resource: Model): boolean {
      const deleteAt = resource.getAttribute(this.getDeletedAtKey());

      return ![this.getDeletedAtValueOnRestore(), undefined].includes(deleteAt);
    }

    /**
     * Get name of `deleted_at` key.
     */
    public getDeletedAtKey(): string {
      return 'deleted_at';
    }

    /**
     * Get value for `deleted_at` key.
     */
    public getDeletedAtValue(): unknown {
      return new Date().toDateString();
    }

    /**
     * Get value for available records.
     *
     * @deprecated Use `getDeletedAtValueOnRestore` instead.
     */
    public getSoftDeleteValue(): unknown {
      return this.getDeletedAtValueOnRestore();
    }

    /**
     * Get value for available records.
     */
    public getDeletedAtValueOnRestore(): unknown {
      return null;
    }
  }

  return SoftDeletes;
};
