import { pascalCase } from 'change-case-all';
import { AbstractMixable } from '../Contracts';

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
    getAttributeValue<T extends unknown = any>(key: string): T {
      const mutator = `get${pascalCase(key)}Attribute` as keyof this;
      const value = this.attributes[key] as T;

      return typeof this[mutator] === 'function'
        ? ((this[mutator] as Function).apply(this, [value]) as T)
        : value;
    }
  }

  return HasAttributes;
};
