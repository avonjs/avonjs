import { AnySchema } from 'joi';
import { Direction, Operator } from './constants';
import { Fluent } from '../Models';
import { Model } from './interfaces';

export type SerializedAction = {
  uriKey: string;
  isStandalone: boolean;
  fields: Record<string, any>[];
};

// extends QueryParameter
export type MatchesQueryParameters<T> = Array<{ handler: T; value: any }>;

export type IndexSerializedResource = {
  fields: Record<string, any>;
  authorization: {
    authorizedToView: boolean;
    authorizedToUpdate: boolean;
    authorizedToDelete: boolean;
    authorizedToForceDelete?: boolean;
    authorizedToRestore?: boolean;
    authorizedToReview?: boolean;
  };
};

export type DetailSerializedResource = {
  fields: Record<string, any>;
  authorization: {
    authorizedToUpdate: boolean;
    authorizedToDelete: boolean;
    authorizedToForceDelete?: boolean;
  };
};

export type ReviewSerializedResource = {
  fields: Record<string, any>;
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
