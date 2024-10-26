import type { UUID } from 'node:crypto';
import type { OpenAPIV3 } from 'openapi-types';
import type { Action } from '../Actions';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type {
  AnyRecord,
  AnyValue,
  OpenApiFieldSchema,
  OpenApiSchema,
  Payload,
} from './types';

export interface SearchCollection<TModel extends Model = Model> {
  items: TModel[];
  count: number;
}

export interface ParameterSerializable {
  /**
   * Serialize parameters for schema.
   */
  serializeParameters: (request: AvonRequest) => OpenAPIV3.ParameterObject[];
}

export interface HasSchema {
  /**
   * Get the swagger-ui schema.
   */
  schema: (request: AvonRequest) => OpenApiSchema;
}
export interface FieldSchema {
  /**
   * Get the swagger-ui schema.
   */
  schema: (request: AvonRequest) => OpenApiFieldSchema;
}

export interface Model {
  /**
   * Set value for the given key.
   */
  setAttribute: (key: string, value: AnyValue) => Model;

  /**
   * Get value for the given key.
   */
  getAttribute: <T = undefined>(key: string) => T;

  /**
   * Get the model key.
   */
  getKey: () => string | number;

  /**
   * Get primary key name of the model.
   */
  getKeyName: () => string;

  /**
   * Get all of the model attributes.
   */
  getAttributes: () => AnyRecord;
}

export interface SoftDeletes<TModel extends Model> {
  /**
   * Delete model for the given key.
   */
  forceDelete(key: string | number): Promise<void>;

  /**
   * Restore the delete model for given key.
   */
  restore(key: string | number): Promise<TModel>;

  /**
   * Apply soft-delete constraint.
   */
  withoutTrashed(): this;
  /**
   * Ignore soft-delete constraint.
   */
  withTrashed(): this;

  /**
   * Apply only trashed record constraints.
   */
  onlyTrashed(): this;

  /**
   * Determine whether a given resource is "soft-deleted".
   */
  isSoftDeleted(resource: Model): boolean;
}

export interface ResourceActionEvent {
  resourceName: string;
  resource: Model;
  userId?: string | number;
  payload?: Payload;
  batchId?: UUID;
  previous?: Model;
}

export interface ResourceStoreActionEvent extends ResourceActionEvent {
  payload: Payload;
}

export interface ResourceUpdateActionEvent extends ResourceStoreActionEvent {
  previous: Model;
}

export interface ResourceActionEventForAction
  extends ResourceUpdateActionEvent {
  action: Action;
  batchId: UUID;
}

export interface ActionEventRepository<TModel extends Model> {
  /**
   * Store multiple model's into the storage.
   */
  insert(models: Model[]): Promise<Model[]>;

  /**
   * Fill event model for successful resource store.
   */
  forResourceStore(params: ResourceStoreActionEvent): TModel;

  /**
   * Fill event model for successful resource update.
   */
  forResourceUpdate(params: ResourceUpdateActionEvent): TModel;

  /**
   * Fill event model for successful resource delete.
   */
  forResourceDelete(params: ResourceActionEvent): TModel;

  /**
   * Fill event model for successful resource restore.
   */
  forResourceRestore(params: ResourceActionEvent): TModel;

  /**
   * Fill event model for successful action ran.
   */
  forActionRan(params: ResourceActionEventForAction): TModel;

  /**
   * Delete resource events for ever.
   */
  flush(resourceName: string, key: string | number): Promise<TModel[]>;
}

export interface Transaction {
  commit(value?: AnyValue): Promise<AnyValue>;
  rollback(error?: AnyValue): Promise<AnyValue>;
}

export interface Logger {
  /**
   * Log the "error" level messages.
   */
  error(formatter: string, ...args: unknown[]): Logger;
  /**
   * Log the "info" level messages.
   */
  info(formatter: string, ...args: unknown[]): Logger;
  /**
   * Log the "warn" level messages.
   */
  warn(formatter: string, ...args: unknown[]): Logger;
  /**
   * Log the "debug" level messages.
   */
  dump(formatter: string, ...args: unknown[]): Logger;
}
