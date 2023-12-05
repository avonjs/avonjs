import { randomUUID } from 'crypto';
import {
  AbstractMixable,
  Model,
  Payload,
  Searchable,
  BulkActionResult,
  ActionEventRepository,
} from '../contracts';
import { ActionEvent, Repository } from '../Repositories';
import { Action } from '../Actions';
import { Fluent } from '../Models';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class RecordsResourceEvents extends Parent {
    /**
     * Indicates related resource model.
     */
    public abstract resource?: Model;

    /**
     * Indicates activating record events for the resource.
     */
    recordEvents: boolean = true;

    /**
     * Create an action event for the resource creation.
     */
    async recordCreationEvent(
      payload: Payload = {},
      userId?: string | number,
    ): Promise<void> {
      if (this.isRecordable()) {
        await this.actionRepository().store(
          this.actionRepository().forResourceStore({
            resourceName: this.resourceName(),
            resource: this.resource!,
            userId,
            payload,
          }),
        );
      }
    }

    /**
     * Create an action event for the resource updates.
     */
    async recordUpdateEvent(
      previous: Model,
      payload: Payload = {},
      userId?: string | number,
    ): Promise<void> {
      if (this.isRecordable()) {
        await this.actionRepository().store(
          this.actionRepository().forResourceUpdate({
            resourceName: this.resourceName(),
            resource: this.resource!,
            previous,
            userId,
            payload,
          }),
        );
      }
    }

    /**
     * Create an action event for the resource delete.
     */
    async recordDeletionEvent(userId?: string | number): Promise<void> {
      if (this.isRecordable()) {
        await this.actionRepository().store(
          this.actionRepository().forResourceDelete({
            resourceName: this.resourceName(),
            resource: this.resource!,
            userId,
          }),
        );
      }
    }

    /**
     * Create an action event for the resource delete.
     */
    async recordRestoreEvent(userId?: string | number): Promise<void> {
      if (this.isRecordable()) {
        await this.actionRepository().store(
          this.actionRepository().forResourceRestore({
            resourceName: this.resourceName(),
            resource: this.resource!,
            userId,
          }),
        );
      }
    }

    /**
     * Create an action event for the resource delete.
     */
    async recordStandaloneActionEvent(
      action: Action,
      payload: Payload = {},
      userId?: string | number,
    ): Promise<void> {
      await this.actionRepository().store(
        this.actionRepository().forActionRan({
          resourceName: this.resourceName(),
          resource: new Fluent(),
          previous: new Fluent(),
          batchId: randomUUID(),
          payload,
          action,
          userId,
        }),
      );
    }

    /**
     * Create an action event for the resource delete.
     */
    async recordBulkActionEvent(
      action: Action,
      changes: BulkActionResult = [],
      payload: Payload = {},
      userId?: string | number,
    ): Promise<void> {
      const batchId = randomUUID();

      await this.actionRepository().insert(
        changes.map(({ resource, previous }) => {
          return this.actionRepository().forActionRan({
            resourceName: this.resourceName(),
            resource,
            previous,
            batchId,
            payload,
            action,
            userId,
          });
        }),
      );
    }

    /**
     * Forget action event rows.
     */
    async flushActionEvents(): Promise<void> {
      if (this.isRecordable()) {
        await this.actionRepository().flush(
          this.resourceName(),
          this.resource!.getKey(),
        );
      }
    }

    /**
     * Get action event repository for resource.
     */
    public actionRepository(): Repository & ActionEventRepository<Model> {
      return new (class extends ActionEvent {
        searchableColumns(): Searchable[] {
          return [];
        }
      })();
    }

    /**
     * Determine could record the action.
     */
    public isRecordable(): boolean {
      return (
        this.resource !== undefined &&
        this.resource.getKey() !== undefined &&
        this.recordEvents
      );
    }

    /**
     * Get the resource name fo events.
     */
    public abstract resourceName(): string;
  }

  return RecordsResourceEvents;
};
