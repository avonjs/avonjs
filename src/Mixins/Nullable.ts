import { AbstractMixable, NullableCallback } from '../Contracts';
import { isNullish } from '../helpers';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class Nullable extends Parent {
    /**
     * Indicates if the field is nullable.
     */
    public acceptsNullValues = false;

    /**
     * Values which will be replaced to null.
     */
    public nullValidator: NullableCallback = (value: any) => isNullish(value);

    /**
     * Indicate that the field should be nullable.
     */
    public nullable(
      nullable: boolean = true,
      validator?: NullableCallback,
    ): this {
      this.acceptsNullValues = nullable;

      if (validator !== undefined) {
        this.nullValues(validator);
      }

      return this;
    }

    /**
     * Specify nullable values.
     */
    public nullValues(nullValidator: NullableCallback): this {
      this.nullValidator = nullValidator;

      return this;
    }

    /**
     * Determine if the field supports null values.
     */
    public isNullable(): boolean {
      return this.acceptsNullValues;
    }

    /**
     * Determine if the given value is considered a valid null value if the field supports them.
     */
    public isValidNullValue(value: any): boolean {
      return this.isNullable() && this.valueIsConsideredNull(value);
    }

    /**
     * Determine if the given value is considered null.
     */
    public valueIsConsideredNull(value: any): boolean {
      return this.nullValidator(value);
    }
  }

  return Nullable;
};
