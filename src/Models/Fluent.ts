import type { AnyRecord, Model, PrimaryKey, UnknownRecord } from '../Contracts';
import HasAttributes from '../Mixins/HasAttributes';

export default class Fluent extends HasAttributes(class {}) implements Model {
  constructor(public attributes: UnknownRecord = {}) {
    super();
    // i tested some approach but it have problem with private member assignments
    // biome-ignore lint/correctness/noConstructorReturn: i don't have any solution for it
    return new Proxy(this, {
      get: (parent, property, receiver) => {
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
  setAttributes(attributes: UnknownRecord) {
    for (const key in attributes) {
      this.setAttribute(key, attributes[key]);
    }

    return this;
  }

  /**
   * Set value for the given key.
   */
  setAttribute(key: string, value: unknown) {
    super.setAttributeValue(key, value);

    return this;
  }

  /**
   * Get value for the given key.
   */
  getAttribute<T = undefined>(key: string): T {
    return super.getAttributeValue<T>(key);
  }

  /**
   * Get the model key.
   */
  getKey(): PrimaryKey {
    return this.getAttribute<PrimaryKey>(this.getKeyName());
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
  public getAttributes(): AnyRecord {
    return this.attributes;
  }

  /**
   * Convert attributes to JSON string.
   */
  public toJson(): string {
    return JSON.stringify(this.getAttributes());
  }
}
