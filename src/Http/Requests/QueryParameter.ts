import Nullable from '../../Mixins/Nullable';
import { NullableCallback } from '../../Contracts';

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
