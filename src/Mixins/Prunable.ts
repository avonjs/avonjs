import type { AbstractMixable, AnyValue, PruneCallback } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Prunable extends Parent {
    attribute: AnyValue;

    /**
     * Indicates if the underlying field is prunable.
     */
    public prunable = true;

    /**
     * The callback used to prunable the field.
     */
    public pruneUsingCallback: PruneCallback = this.pruneCallback;

    /**
     * Specify the callback that should be used to prunable the field.
     */
    public pruneUsing(pruneUsingCallback: PruneCallback): this {
      this.pruneUsingCallback = pruneUsingCallback;

      return this;
    }

    /**
     * Determine if the underlying file should be pruned when the resource is deleted.
     */
    public isPrunable(): boolean {
      return this.prunable;
    }

    /**
     * Specify if the underlying field should be pruned when the resource is deleted.
     */
    public withPruning(prunable = true): this {
      this.prunable = prunable;

      return this;
    }

    /**
     * Handle pruning for the incoming requests.
     */
    public async forRequest(request: AvonRequest): Promise<PruneCallback> {
      return this.pruneUsingCallback(
        request,
        await request.findModelOrFail(),
        this.attribute,
      );
    }

    /**
     * Specify the default callback that should be used to prunable the field.
     */
    public abstract pruneCallback(): PruneCallback;
  }

  return Prunable;
};
