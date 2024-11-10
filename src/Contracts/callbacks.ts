import type Field from '../Fields/Field';
import type AvonRequest from '../Http/Requests/AvonRequest';
import type { Repository } from '../Repositories';
import type { Model, Transaction } from './interfaces';
import type { AnyValue, Nullable, Optional } from './types';

export type UserResolver = (
  request: AvonRequest,
) => Promise<Nullable<Model>> | Nullable<Model>;

export type ErrorHandler = (error: Error) => void;

export type RunCallback = (request: AvonRequest, resource: Model) => boolean;

export type SeeCallback = (request: AvonRequest) => boolean;

export type FilledCallback = <TModel extends Model>(
  request: AvonRequest,
  model: TModel,
) => unknown;

export type CallbackStack = [Model, Array<FilledCallback>];

export type NullableCallback = (value: AnyValue) => boolean;

export type FilterableCallback = (
  request: AvonRequest,
  repository: Repository<Model>,
  value: AnyValue,
) => void;

export type OrderingCallback = (
  request: AvonRequest,
  repository: Repository<Model>,
  value: AnyValue,
) => AnyValue;

export type EvaluatorCallback = (request: AvonRequest) => boolean;
export type ResourceEvaluatorCallback = (
  request: AvonRequest,
  resource?: Model,
) => boolean;

export type PruneCallback = (
  request: AvonRequest,
  resource: Model,
  attribute: string,
) => AnyValue;

export type ResolveCallback = (
  value: AnyValue,
  resource: Model,
  attribute: string,
) => AnyValue;

export type FillCallback = <TModel extends Model>(
  request: AvonRequest,
  model: TModel,
  attribute: string,
  requestAttribute: string,
) => FilledCallback | unknown;

export type DefaultCallback = (request: AvonRequest) => AnyValue;

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
) => Promise<Auth | Nullable>;

export type TransactionCallback<V, R extends Repository> = (
  repository: R,
  transacting: Transaction,
) => Promise<V>;

export type QueryModifierCallback<T = AnyValue> = (query: T) => T;

export type SanitizeCallback = (
  request: AvonRequest,
  resources: Model[],
) => Model[];

export type UnaryFunction<T, R> = (source: T) => R;
