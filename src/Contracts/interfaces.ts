import { OpenAPIV3 } from 'openapi-types';
import AvonRequest from '../Http/Requests/AvonRequest';
import { OpenApiFieldSchema, OpenApiSchema, Payload } from './types';
import { Action } from '../Actions';
import { UUID } from 'crypto';

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
  setAttribute: (key: string, value: any) => Model;

  /**
   * Get value for the given key.
   */
  getAttribute: <T extends any = any>(key: string) => T;

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
  all: () => Record<string, any>;
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
  commit(value?: any): Promise<any>;
  rollback(error?: any): Promise<any>;
}
