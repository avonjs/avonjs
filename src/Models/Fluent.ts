import collect from 'collect.js';
import { Model } from '../Contracts';
import HasAttributes from '../Mixins/HasAttributes';

export default class Fluent extends HasAttributes(class {}) implements Model {
  constructor(public attributes: Record<string, unknown> = {}) {
    super();
    return new Proxy(this, {
      get: function (parent, property, receiver): any {
        // handle exists method
        if (property in parent) {
          return parent[property as keyof typeof parent];
        }

        return parent.getAttribute(property as string);
      },
      set: (model, key: string, value) => {
        model.setAttribute(key, value ?? true);

        return true;
      },
    });
  }

  /**
   * Set the attributes.
   */
  setAttributes(attributes: Record<string, unknown>): this {
    for (const key in attributes) {
      this.setAttribute(key, attributes[key]);
    }

    return this;
  }

  /**
   * Set value for the given key.
   */
  setAttribute(key: string, value: any): Fluent {
    super.setAttributeValue(key, value);

    return this;
  }

  /**
   * Get value for the given key.
   */
  getAttribute<T extends any = undefined>(key: string): T {
    return super.getAttributeValue<T>(key);
  }

  /**
   * Get the model key.
   */
  getKey(): string | number {
    return this.getAttribute(this.getKeyName())!;
  }

  /**
   * Get primary key name of the model.
   */
  getKeyName(): string {
    return 'id';
  }

  /**
   * Return all the attributes.
   */
  public getAttributes(): Record<string, any> {
    return this.attributes;
  }

  /**
   * Convert attributes to JSON string.
   */
  public toJson(): string {
    return JSON.stringify(this.getAttributes());
  }
}
