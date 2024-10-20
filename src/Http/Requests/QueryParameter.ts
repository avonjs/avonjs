import type { NullableCallback } from '../../Contracts';
import Nullable from '../../Mixins/Nullable';

export default abstract class QueryParameter extends Nullable(class {}) {
  /**
   * Get the query parameter key name.
   */
  abstract key(): string;

  public nullable(
    nullable?: boolean,
    validator?: NullableCallback | undefined,
  ): this {
    return super.nullable(nullable, validator);
  }
}
