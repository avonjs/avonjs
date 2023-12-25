import { Model } from '../Contracts';

export default class Fluent implements Model {
  constructor(protected attributes: Record<any, any> = {}) {
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
   * Set value for the given key.
   */
  setAttribute(key: string, value: any): Fluent {
    this.attributes[key] = value;

    return this;
  }

  /**
   * Get value for the given key.
   */
  getAttribute(key: string): any {
    return this.attributes[key];
  }

  /**
   * Get the model key.
   */
  getKey(): string | number {
    return this.getAttribute(this.getKeyName());
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
  public all(): Record<string, any> {
    return this.attributes;
  }

  /**
   * Convert attributes to JSON string.
   */
  public toJson(): string {
    return JSON.stringify(this.all());
  }
}
