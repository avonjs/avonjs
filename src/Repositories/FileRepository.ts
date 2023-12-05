import collect, { Collection } from 'collect.js';
import { Fluent } from '../Models';
import fs from 'fs';
import CollectionRepository from './CollectionRepository';

export default abstract class FileRepository extends CollectionRepository {
  /**
   * Initiate repository instance.
   */
  constructor(items: any[] = []) {
    super();
    this.collection = new Collection<Fluent>(
      this.prepareItems(items.concat(this.resolveItems())),
    );
  }

  /**
   * Resolve items from the store path.
   */
  protected resolveItems(): Record<string | number, any> {
    const data = fs.readFileSync(this.filepath()).toString();

    return JSON.parse(data).filter((item: any) => collect(item).isNotEmpty());
  }

  /**
   * Store given model into the storage.
   */
  async store(model: Fluent): Promise<Fluent> {
    await super.store(model);

    this.write(this.collection.all());

    return model;
  }

  /**
   * Store given model into the storage.
   */
  async update(model: Fluent): Promise<Fluent> {
    await super.update(model);

    this.write(this.collection.all());

    return model;
  }

  /**
   * Delete model for the given key.
   */
  async delete(key: string | number): Promise<void> {
    await super.delete(key);

    this.write(this.collection.all());
  }

  /**
   * Write given items to storage.
   */
  protected write(items: Fluent[]): any {
    fs.writeFileSync(
      this.filepath(),
      JSON.stringify(items.map((item) => item.all())),
    );
  }

  /**
   * Get path of the stored files.
   */
  abstract filepath(): string;
}
