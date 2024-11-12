import { randomUUID } from 'node:crypto';
import type { Action } from '../Actions';
import type {
  AbstractMixable,
  ActionEventRepository,
  BulkActionResult,
  Model,
  Payload,
  PrimaryKey,
  Searchable,
  Transaction,
} from '../Contracts';
import { Fluent } from '../Models';
import { ActionEvent, type Repository } from '../Repositories';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class RecordsResourceEvents extends Parent {
    /**
     * Indicates related resource model.
     */
    public abstract resource: Model;

    /**
     * Indicates activating record events for the resource.
     */
    recordEvents = true;

    /**
     * Create an action event for the resource creation.
     */
    async recordCreationEvent(
      payload: Payload = {},
      transaction?: Transaction,
      userId?: PrimaryKey,
    ) {
      if (this.isRecordable()) {
        await this.makeActionRepository(transaction).store(
          this.actionRepository().forResourceStore({
            resourceName: this.resourceName(),
            resource: this.resource,
            payload: this.sanitizePayload(payload),
            userId,
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
      transaction?: Transaction,
      userId?: PrimaryKey,
    ) {
      if (this.isRecordable()) {
        await this.makeActionRepository(transaction).store(
          this.actionRepository().forResourceUpdate({
            resourceName: this.resourceName(),
            resource: this.resource,
            payload: this.sanitizePayload(payload),
            previous,
            userId,
          }),
        );
      }
    }

    /**
     * Create an action event for the resource delete.
     */
    async recordDeletionEvent(transaction?: Transaction, userId?: PrimaryKey) {
      if (this.isRecordable()) {
        await this.makeActionRepository(transaction).store(
          this.actionRepository().forResourceDelete({
            resourceName: this.resourceName(),
            resource: this.resource,
            userId,
          }),
        );
      }
    }

    /**
     * Create an action event for the resource delete.
     */
    async recordRestoreEvent(transaction?: Transaction, userId?: PrimaryKey) {
      if (this.isRecordable()) {
        await this.makeActionRepository(transaction).store(
          this.actionRepository().forResourceRestore({
            resourceName: this.resourceName(),
            resource: this.resource,
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
      userId?: PrimaryKey,
    ) {
      await this.makeActionRepository().store(
        this.actionRepository().forActionRan({
          resourceName: this.resourceName(),
          resource: new Fluent(),
          previous: new Fluent(),
          batchId: randomUUID(),
          payload: this.sanitizePayload(payload),
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
      userId?: PrimaryKey,
    ) {
      const batchId = randomUUID();

      await this.makeActionRepository().insert(
        changes.map(({ resource, previous }) => {
          return this.actionRepository().forActionRan({
            resourceName: this.resourceName(),
            payload: this.sanitizePayload(payload),
            resource,
            previous,
            batchId,
            action,
            userId,
          });
        }),
      );
    }

    /**
     * Forget action event rows.
     */
    async flushActionEvents(transaction?: Transaction) {
      if (this.isRecordable()) {
        await this.makeActionRepository(transaction).flush(
          this.resourceName(),
          this.resource.getKey(),
        );
      }
    }

    /**
     * Make action events repository with given transaction;
     */
    makeActionRepository(transaction?: Transaction) {
      return this.actionRepository().setTransaction(transaction);
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
     * Removes unsafe values from the record to ensure data integrity.
     */
    public sanitizePayload(payload: Payload): Payload {
      return payload;
    }

    /**
     * Get the resource name fo events.
     */
    public abstract resourceName(): string;
  }

  return RecordsResourceEvents;
};
