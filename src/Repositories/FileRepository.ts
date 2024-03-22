import collect, { Collection } from 'collect.js';
import { Fluent } from '../Models';
import fs from 'fs';
import CollectionRepository from './CollectionRepository';
import { CollectionRecord } from '../Contracts';

export default abstract class FileRepository extends CollectionRepository {
  /**
   * Resolve items from the store path.
   */
  protected resolveItems(): CollectionRecord[] {
    const data = fs.readFileSync(this.filepath()).toString();

    return JSON.parse(data).filter((item: any) => collect(item).isNotEmpty());
  }

  /**
   * Store given model into the storage.
   */
  async store(model: Fluent): Promise<Fluent> {
    this.write(
      this.makeCollection()
        .push(
          model.setAttribute(
            model.getKeyName(),
            model.getKey() ?? this.newId(),
          ),
        )
        .all(),
    );

    return model;
  }

  /**
   * Store given model into the storage.
   */
  async update(model: Fluent): Promise<Fluent> {
    this.write(
      this.makeCollection()
        .map((item) => (item.getKey() === model.getKey() ? model : item))
        .all(),
    );

    return model;
  }

  /**
   * Delete model for the given key.
   */
  async delete(key: string | number): Promise<void> {
    this.write(
      this.makeCollection()
        .filter((item) => item.getKey() !== key)
        .all(),
    );
  }

  /**
   * Write given items to storage.
   */
  protected write(items: Fluent[]): any {
    fs.writeFileSync(
      this.filepath(),
      JSON.stringify(items.map((item) => item.getAttributes())),
    );
  }

  /**
   * Get path of the stored files.
   */
  abstract filepath(): string;
}
