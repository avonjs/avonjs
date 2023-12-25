export enum Ability {
  viewAny = 'viewAny',
  create = 'create',
  update = 'update',
  view = 'view',
  delete = 'delete',
  forceDelete = 'forceDelete',
  restore = 'restore',
  review = 'review',
  add = 'add',
  attach = 'attach',
  detach = 'detach',
}

export enum Direction {
  ASC = 'asc',
  DESC = 'desc',
}

export enum Operator {
  eq = '=',
  not = '!=',
  lt = '<',
  lte = '<=',
  gt = '>',
  gte = '>=',
  in = 'in',
  notIn = 'notIn',
  like = 'like',
}

export enum RequestTypes {
  ResourceCreateOrAttachRequest = 'ResourceCreateOrAttachRequest',
  ResourceUpdateOrUpdateAttachedRequest = 'ResourceUpdateOrUpdateAttachedRequest',
  ResourceIndexRequest = 'ResourceIndexRequest',
  ResourceDetailRequest = 'ResourceDetailRequest',
  ResourceReviewRequest = 'ResourceReviewRequest',
  ResourceDeleteRequest = 'ResourceDeleteRequest',
  ResourceForceDeleteRequest = 'ResourceForceDeleteRequest',
  ResourceRestoreRequest = 'ResourceRestoreRequest',
  ActionRequest = 'ActionRequest',
  LoginRequest = 'LoginRequest',
  AssociableRequest = 'AssociableRequest',
  SchemaRequest = 'SchemaRequest',
}

export enum TrashedStatus {
  DEFAULT = 'without',
  WITH = 'with',
  ONLY = 'only',
}
