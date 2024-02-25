import collect from 'collect.js';
import { randomUUID } from 'crypto';
import { Fluent } from '../Models';
import { Repository } from '../Repositories';
import {
  AbstractMixable,
  Model,
  Operator,
  ResourceActionEvent,
  ResourceActionEventForAction,
  ResourceStoreActionEvent,
  ResourceUpdateActionEvent,
} from '../Contracts';

export default <T extends AbstractMixable<Repository>>(Parent: T) => {
  abstract class FillsActionEvents extends Parent {
    /**
     * Store multiple model's into the storage.
     */
    async insert(models: Model[]): Promise<Model[]> {
      return Promise.all(models.map((model) => this.store(model)));
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
    public defaultAttributes(params: ResourceActionEvent): Record<string, any> {
      return {
        payload: params.payload ?? {},
        resource_name: params.resourceName,
        resource_id: params.resource.getKey(),
        model_type: params.resource.constructor.name,
        model_id: params.resource.getKey(),
        changes: {},
        original: {},
        user_id: params.userId ?? null,
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

  return FillsActionEvents;
};
