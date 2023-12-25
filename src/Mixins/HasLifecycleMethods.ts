import { AbstractMixable } from '../Contracts';
import AvonRequest from '../Http/Requests/AvonRequest';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class HasLifecycleMethods extends Parent {
    /**
     * Register a callback to be called before the resource create.
     */
    public beforeCreate(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called after the resource is created.
     */
    public afterCreate(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called before the resource update.
     */
    public beforeUpdate(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called after the resource is updated.
     */
    public afterUpdate(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called before the resource delete.
     */
    public beforeDelete(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called after the resource is destroyed.
     */
    public afterDelete(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called before the resource force-destroyed.
     */
    public beforeForceDelete(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called after the resource is force-destroyed.
     */
    public afterForceDelete(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called before the resource restore.
     */
    public beforeRestore(request: AvonRequest): void {
      //
    }

    /**
     * Register a callback to be called after the resource is restored.
     */
    public afterRestore(request: AvonRequest): void {
      //
    }
  }

  return HasLifecycleMethods;
};
