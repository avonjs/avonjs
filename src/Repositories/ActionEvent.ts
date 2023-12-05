import collect from 'collect.js';
import { Fluent } from '../Models';
import {
  Model,
  Where,
  Operator,
  Searchable,
  ActionEventRepository,
  ResourceActionEvent,
  ResourceUpdateActionEvent,
  ResourceActionEventForAction,
  ResourceStoreActionEvent,
} from '../contracts';
import CollectionRepository from './CollectionRepository';
import { randomUUID } from 'crypto';

export default class
  extends CollectionRepository
  implements ActionEventRepository<Model>
{
  /**
   * Get key name of the item.
   */
  searchableColumns(): Searchable[] {
    return [];
  }

  /**
   * Store multiple model's into the storage.
   */
  async insert(models: Fluent[]): Promise<Fluent[]> {
    // ensure log file exists
    return Promise.all(
      models.map(async (model) => {
        return this.store(
          model.setAttribute(model.getKeyName(), this.makeIdentifier()),
        );
      }),
    );
  }

  /**
   * Store given model into the storage.
   */
  async update(model: Fluent): Promise<Fluent> {
    throw new Error('Update action event is not possible.');
  }

  /**
   * Apply the where constraint on the collection item.
   */
  public checkAgainstWhere(item: Fluent, where: Where): boolean {
    const value = Array.isArray(where.value)
      ? where.value
      : String(where.value);
    const resourceValue = String(item.getAttribute(where.key));

    switch (where.operator) {
      case Operator.in:
      case Operator.eq:
        // eslint-disable-next-line no-case-declarations
        const values = Array.isArray(where.value) ? where.value : [where.value];

        return values.some((value) => value === resourceValue);
      case Operator.lte:
        return resourceValue <= value;
      case Operator.gte:
        return resourceValue >= value;
      case Operator.not:
        return resourceValue !== value;
      case Operator.lt:
        return resourceValue < value;
      case Operator.gt:
        return resourceValue > value;
      default:
        return true;
    }
  }

  /**
   * makeIdentifier
   */
  public makeIdentifier(): string | number {
    return new Date().toISOString().substring(0, 10) + ':' + String(Date.now());
  }

  /**
   * Get key name of the item.
   */
  searchable(): Searchable[] {
    return [];
  }

  /**
   * Fill event model for successful resource store.
   */
  public forResourceStore(params: ResourceStoreActionEvent): Fluent {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Create',
      changes: params.resource.all(),
    });
  }

  /**
   * Fill event model for successful resource update.
   */
  public forResourceUpdate(params: ResourceUpdateActionEvent): Fluent {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Update',
      changes: collect(params.resource.all())
        .diffAssoc(collect(params.previous.all()))
        .all(),
      original: params.previous.all(),
    });
  }

  /**
   * Fill event model for successful resource destroy.
   */
  public forResourceDelete(params: ResourceActionEvent): Fluent {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Delete',
      changes: {},
      original: params.resource.all(),
    });
  }

  /**
   * Fill event model for successful resource restore.
   */
  public forResourceRestore(params: ResourceActionEvent): Fluent {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Restore',
      changes: {},
    });
  }

  /**
   * Fill event model for successful action ran.
   */
  public forActionRan(params: ResourceActionEventForAction): Fluent {
    return new Fluent({
      ...this.defaultAttributes(params),
      batch_id: params.batchId ?? randomUUID(),
      name: params.action.name(),
      original: params.previous.all(),
      changes: collect(params.resource.all())
        .diffAssoc(collect(params.previous.all()))
        .all(),
    });
  }

  /**
   * Get the default attributes for creating a new action event.
   */
  protected defaultAttributes(
    params: ResourceActionEvent,
  ): Record<string, any> {
    return {
      payload: params.payload ?? {},
      resource_name: params.resourceName,
      resource_id: params.resource.getKey(),
      model_type: params.resource.constructor.name,
      model_id: params.resource.getKey(),
      changes: {},
      original: {},
      status: 'finished',
      user_id: params.userId,
      batch_id: params.batchId ?? randomUUID(),
    };
  }

  /**
   * Delete resource events for ever.
   */
  async flush(resourceName: string, key: string | number): Promise<Model[]> {
    const events = await this.scopeResource(resourceName, key).all();

    await Promise.all(events.map((event) => this.delete(event.getKey())));

    return events;
  }

  /**
   * Limit query to the given resource.
   */
  scopeResource(resourceName: string, key: string | number) {
    return this.where([
      {
        key: 'resource_id',
        value: key,
        operator: Operator.eq,
      },
      {
        key: 'resource_name',
        value: resourceName,
        operator: Operator.eq,
      },
    ]);
  }
}
