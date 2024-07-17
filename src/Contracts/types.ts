import { AnySchema } from 'joi';
import { Direction, Operator } from './constants';
import { Fluent } from '../Models';
import { Model } from './interfaces';
import { OpenAPIV3 } from 'openapi-types';
import { Params } from 'express-jwt';

export type SerializedAction = {
  uriKey: string;
  isStandalone: boolean;
  fields: Record<string, any>[];
};

// extends QueryParameter
export type MatchesQueryParameters<T> = Array<{ handler: T; value: any }>;

export type ResourceMetaData = {
  softDeletes: Boolean;
  softDeleted: Boolean;
};

export type SerializedResource = {
  fields: Record<string, any>;
  metadata: ResourceMetaData;
  authorization: Record<string, boolean | undefined>;
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

export type Where = { key: string; value: any; operator: Operator };

export type Order = { key: string; direction: Direction };

export type Rules = Record<string, AnySchema>;

export type Searchable = RegExp | ((search: string, item: Fluent) => boolean);

export type Payload = Record<string, unknown>;

export type BulkActionResult = Array<{ resource: Model; previous: Model }>;

export type Attachable = { id: string | number; [key: string]: any };

export type OpenApiSchema = OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;

export type OpenApiFieldSchema = {
  response: OpenApiSchema;
  payload: OpenApiSchema;
};

export type JwVerifyOptions = Params & { secret: string };

export type CollectionRecord = Record<string, any>;

export type EnumValues = unknown[];

export type RequestBodyContent = Record<string, OpenAPIV3.MediaTypeObject>;
