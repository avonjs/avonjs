import collect from 'collect.js';
import ModelNotFoundException from '../Exceptions/ModelNotFoundException';
import {
  Model,
  AbstractMixable,
  Where,
  Operator,
  SoftDeletes as SoftDeletesContract,
} from '../contracts';
import Repository from '../Repositories/Repository';

export default <
  TModel extends Model,
  TBase extends AbstractMixable<Repository<TModel>>,
>(
  Parent: TBase,
) => {
  abstract class SoftDeletes extends Parent {
    constructor(...params: any[]) {
      super(params);
      this.applySoftDelete();
    }

    /**
     * Delete model for the given key.
     */
    async delete(key: string | number): Promise<void> {
      const model = await this.find(key);

      if (model === undefined) {
        return;
      }

      model.setAttribute(this.getDeletedAtKey(), this.getDeletedAtValue());

      await this.update(model);
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

      model.setAttribute(this.getDeletedAtKey(), null);

      return this.update(model);
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
        value: [null, undefined],
        operator: Operator.in,
      };
    }

    /**
     * Get only trashed records constraint.
     */
    public scopeTrashedRecords(): Where {
      return {
        key: this.getDeletedAtKey(),
        value: [null, undefined],
        operator: Operator.notIn,
      };
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
    public getDeletedAtValue(): string {
      return new Date().toDateString();
    }
  }

  return SoftDeletes;
};
