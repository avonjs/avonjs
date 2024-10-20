import { pascalCase } from 'change-case-all';
import collect from 'collect.js';
import type { AbstractMixable } from '../Contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class HasAttributes extends Parent {
    /**
     * The model's attributes.
     */
    public attributes: Record<string, unknown> = {};

    /**
     * Set value for the given key.
     */
    setAttributeValue<T = never>(key: string, value: T): this {
      const mutator = `set${pascalCase(key)}Attribute` as keyof this;

      // Check if the mutator method exists and is a function
      if (typeof this[mutator] === 'function') {
        // Use the correct function signature for the mutator
        const mutatorFn = this[mutator] as (arg: T) => void;
        mutatorFn.apply(this, [value]);
      } else {
        // Fallback to setting the attribute directly if no mutator exists
        this.attributes[key] = value;
      }

      return this;
    }

    /**
     * Get value for the given key.
     */
    getAttributeValue<T = undefined>(key: string): T {
      const value = this.attributes[key] as T;

      // Dynamically construct the mutator method name
      const mutator = `get${pascalCase(key)}Attribute` as keyof this;

      // Check if the mutator method exists and is a function
      if (typeof this[mutator] === 'function') {
        // Use correct typing for the mutator method instead of Function type
        const mutatorFn = this[mutator] as (arg: T) => T;
        return mutatorFn.apply(this, [value]);
      }

      // Return the attribute value directly if no mutator method exists
      return value;
    }

    /**
     * Get all mutated values.
     */
    getAttributesValue() {
      return collect(this.attributes)
        .map((value, key) => this.getAttributeValue(key))
        .all();
    }
  }

  return HasAttributes;
};
