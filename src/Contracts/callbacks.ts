import Field from '../Fields/Field';
import ActionRequest from '../Http/Requests/ActionRequest';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Repository } from '../Repositories';
import { Model, Transaction } from './interfaces';

export type UserResolver = (request: AvonRequest) => Model | undefined;

export type ErrorHandler = (error: Error) => void;

export type RunCallback = (request: AvonRequest, resource: Model) => boolean;

export type SeeCallback = (request: AvonRequest) => boolean;

export type FilledCallback = <TModel extends Model>(
  request: AvonRequest,
  model: TModel,
  transaction?: any,
) => any;

export type CallbackStack = [Model, Array<FilledCallback>];

export type NullableCallback = (value: any) => boolean;

export type FilterableCallback = (
  request: AvonRequest,
  repository: Repository<Model>,
  value: any,
) => void;

export type OrderingCallback = (
  request: AvonRequest,
  repository: Repository<Model>,
  value: any,
) => any;

export type EvaluatorCallback = (request: AvonRequest) => boolean;
export type ResourceEvaluatorCallback = (
  request: AvonRequest,
  resource?: Model,
) => boolean;

export type PruneCallback = (
  request: AvonRequest,
  resource: Model,
  attribute: string,
) => any;

export type ResolveCallback = (
  value: any,
  resource: Model,
  attribute: string,
) => any;

export type FillCallback = <TModel extends Model>(
  request: AvonRequest,
  model: TModel,
  attribute: string,
  requestAttribute: string,
) => FilledCallback | undefined | void;

export type DefaultCallback = (request: AvonRequest) => any;

export type PivotFieldCallback = (request: AvonRequest) => Field[];

export type DisplayFieldCallback = (request: AvonRequest) => Field[];

export type RelatableQueryCallback = (
  request: AvonRequest,
  repository: Repository<Model>,
) => Repository<Model>;

export type Auth = {
  id: string | number;
};

export type AttemptCallback = (
  payload: Record<string, unknown>,
) => Promise<Auth | null | undefined | void>;

export type TransactionCallback<V extends unknown, R extends Repository> = (
  repository: R,
  transacting?: Transaction,
) => Promise<V>;

export type QueryModifierCallback<T = any> = (query: T) => T;
