import { pascalCase } from 'change-case-all';
import collect from 'collect.js';
import type { AbstractMixable, AnyRecord } from '../Contracts';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class HasAttributes extends Parent {
    /**
     * The model's attributes.
     */
    public attributes: Record<string, unknown> = {};

    /**
     * Get hidden attributes on the serialization.
     */
    public hidden: string[] = [];

    /**
     * Get visible attributes on the serialization.
     */
    public visible: string[] = [];

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
     * Make an attribute serializable.
     */
    makeVisible(attribute: string) {
      this.visible.push(attribute);

      return this;
    }

    /**
     * Hidden an attribute from serializable.
     */
    makeHidden(attribute: string) {
      this.hidden.push(attribute);

      return this;
    }

    /**
     * Get all mutated values.
     */
    getAttributes(): AnyRecord {
      return this.attributes;
    }

    /**
     * Get all mutated values.
     */
    getAttributesValue() {
      return collect(this.getAttributes())
        .map((value, key) => this.getAttributeValue(key))
        .all();
    }

    /**
     * Get all serializable attributes.
     */
    toSerializable(): AnyRecord {
      const attributes = collect(this.attributes).except(this.hidden);

      if (this.visible.length > 0) {
        return attributes.only(this.visible).all();
      }

      return attributes.all();
    }
  }

  return HasAttributes;
};
