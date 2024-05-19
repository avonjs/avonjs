import { AbstractMixable, Model, Transaction } from '../Contracts';
import AvonRequest from '../Http/Requests/AvonRequest';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class HasLifecycleMethods extends Parent {
    /**
     * Register a callback to be called before the resource create.
     */
    public beforeCreate(request: AvonRequest, transaction?: Transaction): void {
      //
    }

    /**
     * Register a callback to be called after the resource is created.
     */
    public afterCreate(request: AvonRequest, transaction?: Transaction): void {
      //
    }

    /**
     * Register a callback to be called before the resource update.
     */
    public beforeUpdate(request: AvonRequest, transaction?: Transaction): void {
      //
    }

    /**
     * Register a callback to be called after the resource is updated.
     */
    public afterUpdate(
      request: AvonRequest,
      resource: Model,
      transaction?: Transaction,
    ): void {
      //
    }

    /**
     * Register a callback to be called before the resource delete.
     */
    public beforeDelete(request: AvonRequest, transaction?: Transaction): void {
      //
    }

    /**
     * Register a callback to be called after the resource is destroyed.
     */
    public afterDelete(request: AvonRequest, transaction?: Transaction): void {
      //
    }

    /**
     * Register a callback to be called before the resource force-destroyed.
     */
    public beforeForceDelete(
      request: AvonRequest,
      transaction?: Transaction,
    ): void {
      //
    }

    /**
     * Register a callback to be called after the resource is force-destroyed.
     */
    public afterForceDelete(
      request: AvonRequest,
      transaction?: Transaction,
    ): void {
      //
    }

    /**
     * Register a callback to be called before the resource restore.
     */
    public beforeRestore(
      request: AvonRequest,
      transaction?: Transaction,
    ): void {
      //
    }

    /**
     * Register a callback to be called after the resource is restored.
     */
    public afterRestore(request: AvonRequest, transaction?: Transaction): void {
      //
    }
  }

  return HasLifecycleMethods;
};
