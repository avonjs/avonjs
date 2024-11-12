import fs from 'node:fs';
import collect from 'collect.js';
import type { CollectionRecord, PrimaryKey } from '../Contracts';
import type { Fluent } from '../Models';
import CollectionRepository from './CollectionRepository';

export default abstract class FileRepository extends CollectionRepository {
  /**
   * Resolve items from the store path.
   */
  protected resolveItems(): CollectionRecord[] {
    const data = fs.readFileSync(this.filepath()).toString();

    return JSON.parse(data).filter((item: never) => collect(item).isNotEmpty());
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
  async delete(key: PrimaryKey): Promise<void> {
    this.write(
      this.makeCollection()
        .filter((item) => item.getKey() !== key)
        .all(),
    );
  }

  /**
   * Write given items to storage.
   */
  protected write(items: Fluent[]) {
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
