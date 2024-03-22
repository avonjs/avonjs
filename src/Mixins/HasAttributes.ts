import { pascalCase } from 'change-case-all';
import { AbstractMixable } from '../Contracts';
import collect from 'collect.js';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class HasAttributes extends Parent {
    /**
     * The model's attributes.
     */
    public attributes: Record<string, unknown> = {};

    /**
     * Set value for the given key.
     */
    setAttributeValue(key: string, value: any): this {
      const mutator = `set${pascalCase(key)}Attribute` as keyof this;

      if (typeof this[mutator] === 'function') {
        (this[mutator] as Function).apply(this, [value]);
      } else {
        this.attributes[key] = value;
      }

      return this;
    }

    /**
     * Get value for the given key.
     */
    getAttributeValue<T extends any = undefined>(key: string): T {
      const value = this.attributes[key] as T;
      const mutator = `get${pascalCase(key)}Attribute` as keyof this;

      return value !== undefined && typeof this[mutator] === 'function'
        ? (this[mutator] as Function).apply(this, [value])
        : value;
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
