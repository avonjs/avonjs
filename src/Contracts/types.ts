import type { Params } from 'express-jwt';
import type { AnySchema } from 'joi';
import type { OpenAPIV3 } from 'openapi-types';
import type { Fluent } from '../Models';
import type { Direction, Operator } from './constants';
import type { Model } from './interfaces';

export type SerializedAction = {
  uriKey: string;
  isStandalone: boolean;
  fields: AnyRecord[];
};

export type QueryHandler<T> = {
  handler: T;
  value: AnyValue;
};

export type MatchedQueryHandlers<T> = QueryHandler<T>[];

export type ResourceMetaData = {
  softDeletes: boolean;
  softDeleted: boolean;
};

export type SerializedResource = {
  fields: AnyRecord;
  metadata: ResourceMetaData;
  authorization: Dictionary<Optional<boolean>>;
};

export type IndexSerializedResource = SerializedResource & {
  authorization: {
    authorizedToView: boolean;
    authorizedToUpdate: boolean;
    authorizedToDelete: boolean;
    authorizedToForceDelete?: boolean;
    authorizedToRestore?: boolean;
    authorizedToReview?: boolean;
  };
};

export type DetailSerializedResource = SerializedResource & {
  authorization: {
    authorizedToUpdate: boolean;
    authorizedToDelete: boolean;
    authorizedToForceDelete?: boolean;
  };
};

export type StoreSerializedResource = SerializedResource & {
  authorization: {
    authorizedToUpdate: boolean;
    authorizedToDelete: boolean;
    authorizedToForceDelete?: boolean;
  };
};

export type UpdateSerializedResource = SerializedResource & {
  authorization: {
    authorizedToDelete: boolean;
    authorizedToForceDelete?: boolean;
  };
};

export type ReviewSerializedResource = SerializedResource & {
  authorization: {
    authorizedToForceDelete: boolean;
    authorizedToRestore: boolean;
  };
};

export type Where = { key: string; value: AnyValue; operator: Operator };

export type Order = { key: string; direction: Direction };

export type Rules = Dictionary<AnySchema>;

export type Searchable = RegExp | ((search: string, item: Fluent) => boolean);

export type Payload = Dictionary<unknown>;

export type BulkActionResult = Array<{ resource: Model; previous: Model }>;

export type Attachable = { id: PrimaryKey } & AnyRecord;

export type OpenApiSchema = OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;

export type OpenApiFieldSchema = {
  response: OpenApiSchema;
  payload: OpenApiSchema;
};

export type JwVerifyOptions = Params & { secret: string };

export type CollectionRecord = AnyRecord;

export type EnumValues = unknown[];

// TODO: Should fix later
// biome-ignore lint/suspicious/noExplicitAny: Should fix later
export type AnyValue = any;
export type AnyArray = Array<AnyValue>;
export type Args = AnyArray;
export type Optional<T> = T | undefined;
export type Nullable<T = undefined> = T | null;
export type PrimaryKey = string | number;
export type Attributes = AnyRecord;

export type Dictionary<T> = Record<string, T>;
export type UnknownRecord = Dictionary<unknown>;
export type RequestBodyContent = Dictionary<OpenAPIV3.MediaTypeObject>;
export type AnyRecord = Dictionary<AnyValue>;
export type Deferred<T> = T | Promise<T>;
