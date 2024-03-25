import collect, { Collection } from 'collect.js';
import { OpenAPIV3 } from 'openapi-types';
import { plural } from 'pluralize';
import { Action } from '../Actions';
import FieldCollection from '../Collections/FieldCollection';
import { Field } from '../Fields';
import Relation from '../Fields/Relation';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Ordering } from '../Orderings';
import {
  AbstractMixable,
  Model,
  OpenApiSchema,
  TrashedStatus,
} from '../Contracts';
import {
  authorizationResponses,
  errorsResponses,
  slugify,
  validationResponses,
} from '../helpers';
import { Fluent } from '../Models';
import { Repository } from '../Repositories';

export default <T extends AbstractMixable = AbstractMixable>(Parent: T) => {
  abstract class ResourceSchema extends Parent {
    public resource: any;
    /**
     * Indicates resource is available for `index` API.
     */
    public availableForIndex = true;

    /**
     * Indicates resource is available for `detail` API.
     */
    public availableForDetail = true;

    /**
     * Indicates resource is available for `create` API.
     */
    public availableForCreation = true;

    /**
     * Indicates resource is available for `update` API.
     */
    public availableForUpdate = true;

    /**
     * Indicates resource is available for `delete` API.
     */
    public availableForDelete = true;

    /**
     * Indicates resource is available for `force delete` API.
     */
    public availableForForceDelete = true;

    /**
     * Indicates resource is available for `restore` API.
     */
    public availableForRestore = true;

    /**
     * Indicates resource is available for `review` API.
     */
    public availableForReview = true;

    /**
     * Get the Open API json schema.
     */
    public schema(request: AvonRequest): OpenAPIV3.PathsObject {
      const paths = this.apis(request);

      return {
        [paths.index]: {
          ...this.resourceIndexSchema(request),
          ...this.resourceStoreSchema(request),
        },
        [paths.detail]: {
          ...this.resourceDetailSchema(request),
          ...this.resourceUpdateSchema(request),
          ...this.resourceDeleteSchema(request),
        },
        [paths.restore]: {
          ...this.resourceRestoreSchema(request),
        },
        [paths.review]: {
          ...this.resourceReviewSchema(request),
        },
        [paths.forceDelete]: {
          ...this.resourceForceDeleteSchema(request),
        },
        ...this.actionsSchema(request),
        ...this.associationSchema(request),
      };
    }

    public resourceIndexSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForIndex) {
        return {
          get: {
            tags: [this.uriKey()],
            description: `Get list of available ${this.label()}`,
            operationId: `index`,
            parameters: [
              ...this.searchParameters(request),
              ...this.paginationParameters(request),
              ...this.softDeleteParameters(request),
              ...this.filteringParameters(request),
              ...this.orderingParameters(request),
            ],
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              200: {
                description: `Get list of available ${this.label()}`,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              authorization: {
                                type: 'object',
                                properties: {
                                  authorizedToView: {
                                    type: 'boolean',
                                    default: true,
                                    description:
                                      'Determines user authorized to view the resource detail',
                                  },
                                  authorizedToUpdate: {
                                    type: 'boolean',
                                    default: true,
                                    description:
                                      'Determines user authorized to update the resource',
                                  },
                                  authorizedToDelete: {
                                    type: 'boolean',
                                    default: true,
                                    description:
                                      'Determines user authorized to delete the resource',
                                  },
                                  ...(this.softDeletes()
                                    ? {
                                        authorizedToForceDelete: {
                                          type: 'boolean',
                                          default: true,
                                          description:
                                            'Determines user authorized to force-delete the resource',
                                        },
                                        authorizedToRestore: {
                                          type: 'boolean',
                                          default: true,
                                          description:
                                            'Determines user authorized to restore the resource',
                                        },
                                        authorizedToReview: {
                                          type: 'boolean',
                                          default: true,
                                          description:
                                            'Determines user authorized to review soft deleted the resource',
                                        },
                                      }
                                    : {}),
                                },
                              },
                              fields: {
                                type: 'object',
                                properties: this.formatResponseFields(
                                  request,
                                  new FieldCollection(
                                    this.fieldsForIndex(request),
                                  ).filterForIndex(request, this.resource),
                                ),
                              },
                            },
                          },
                        },
                        meta: {
                          type: 'object',
                          properties: {
                            count: {
                              type: 'integer',
                            },
                            page: {
                              type: 'integer',
                            },
                            perPage: {
                              type: 'integer',
                            },
                            perPageOptions: {
                              type: 'array',
                              uniqueItems: true,
                              items: {
                                type: 'integer',
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        };
      }
    }

    /**
     * Get the searching parameters for index schema.
     */
    public searchParameters(request: AvonRequest): OpenAPIV3.ParameterObject[] {
      return [
        {
          name: 'search',
          in: 'query',
          description: 'Enter value to search through records',
          schema: {
            type: 'string',
            nullable: true,
          },
        },
      ];
    }

    /**
     * Get pagination parameters for index schema.
     */
    public paginationParameters(
      request: AvonRequest,
    ): OpenAPIV3.ParameterObject[] {
      return [
        {
          name: 'page',
          in: 'query',
          description: 'The pagination page',
          example: 1,
          schema: {
            type: 'integer',
            minimum: 1,
            nullable: true,
          },
        },
        {
          name: 'perPage',
          in: 'query',
          description: 'Number of items per page',
          example: this.perPageOptions()[0],
          schema: {
            type: 'number',
            nullable: true,
            enum: this.perPageOptions(),
          },
        },
      ];
    }

    /**
     * Get soft delete resource parameters for schema.
     */
    public softDeleteParameters(
      request: AvonRequest,
    ): OpenAPIV3.ParameterObject[] {
      return this.softDeletes() === false
        ? []
        : [
            {
              name: 'trashed',
              in: 'query',
              description: 'Determine trashed items behavior',
              example: TrashedStatus.DEFAULT,
              schema: {
                type: 'string',
                nullable: false,
                enum: [
                  TrashedStatus.WITH,
                  TrashedStatus.ONLY,
                  TrashedStatus.DEFAULT,
                ],
              },
            },
          ];
    }

    /**
     * Get ordering parameters.
     */
    public orderingParameters(
      request: AvonRequest,
    ): OpenAPIV3.ParameterObject[] {
      const orderings: Collection<Ordering> = collect(
        this.resolveOrderings(request),
      );

      this.availableFieldsOnIndexOrDetail(request)
        .withOnlyOrderableFields()
        .each((field: Field) => {
          const ordering = field.resolveOrdering(request);

          if (ordering instanceof Ordering) {
            orderings.push(ordering);
          }
        });

      return orderings
        .unique((ordering: Ordering) => ordering.key())
        .all()
        .flatMap((ordering) => ordering.serializeParameters(request));
    }

    /**
     * Get filtering parameters.
     */
    public filteringParameters(
      request: AvonRequest,
    ): OpenAPIV3.ParameterObject[] {
      const filters: Collection<Filter> = collect(this.resolveFilters(request));

      this.availableFieldsOnIndexOrDetail(request)
        .withOnlyFilterableFields()
        .each((field: Field) => {
          const filter = field.resolveFilter(request);

          if (filter instanceof Filter) {
            filters.push(filter);
          }
        });

      return filters
        .unique((filter: Filter) => filter.key())
        .all()
        .flatMap((filter) => filter.serializeParameters(request));
    }

    /**
     * Get resource store schema.
     */
    public resourceStoreSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForCreation) {
        const fields = new FieldCollection(this.fieldsForCreate(request))
          .withoutUnfillableFields()
          .onlyCreationFields(request);

        return {
          post: {
            tags: [this.uriKey()],
            description: `Create new record for the given payload`,
            operationId: `store`,
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: fields
                      .filter((field) => field.isRequiredForCreation(request))
                      .map((field) => field.attribute)
                      .all(),
                    properties: this.formatPayloadFields(request, fields),
                  },
                },
              },
            },
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              ...this.validationResponses(),
              201: {
                description: `Get detail of stored ${this.label()}`,
                content: this.singleResourceContent(request),
              },
            },
          },
        };
      }
    }

    /**
     *
     */
    public resourceDetailSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForDetail) {
        return {
          get: {
            tags: [this.uriKey()],
            description: `Get detail of resource by the given ${this.label()} key`,
            operationId: `detail`,
            parameters: [...this.singleResourcePathParameters(request)],
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              200: {
                description: `Get detail of ${this.label()} for given id`,
                content: this.singleResourceContent(request),
              },
            },
          },
        };
      }
    }

    /**
     *
     */
    public resourceReviewSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForReview && Boolean(this.softDeletes())) {
        return {
          get: {
            tags: [this.uriKey()],
            description: `Get detail of resource by the given ${this.label()} key`,
            operationId: `review`,
            parameters: [...this.singleResourcePathParameters(request)],
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              200: {
                description: `Get detail of ${this.label()} for given id`,
                content: {
                  ...this.reviewResourceContent(request),
                },
              },
            },
          },
        };
      }
    }

    /**
     *
     */
    public resourceUpdateSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForUpdate) {
        const fields = new FieldCollection(
          this.fieldsForUpdate(request),
        ).onlyCreationFields(request);

        return {
          put: {
            tags: [this.uriKey()],
            description: `Update resource by the given payload`,
            operationId: `update`,
            parameters: [...this.singleResourcePathParameters(request)],
            requestBody: {
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    required: fields
                      .filter((field) => field.isRequiredForUpdate(request))
                      .map((field) => field.attribute)
                      .all(),
                    properties: this.formatPayloadFields(request, fields),
                  },
                },
              },
            },
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              ...this.validationResponses(),
              200: {
                description: `Get detail of updated ${this.label()}`,
                content: this.singleResourceContent(request),
              },
            },
          },
        };
      }
    }

    /**
     *
     */
    public resourceDeleteSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForDelete) {
        return {
          delete: {
            tags: [this.uriKey()],
            description: `Delete ${this.label()} by the given id`,
            operationId: `delete`,
            parameters: [...this.singleResourcePathParameters(request)],
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              204: { $ref: '#/components/responses/EmptyResponse' },
            },
          },
        };
      }
    }

    /**
     *
     */
    public resourceForceDeleteSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForForceDelete && Boolean(this.softDeletes())) {
        return {
          delete: {
            tags: [this.uriKey()],
            description: `Delete ${this.label()} by the given id`,
            operationId: `forceDelete`,
            parameters: [...this.singleResourcePathParameters(request)],
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              204: { $ref: '#/components/responses/EmptyResponse' },
            },
          },
        };
      }
    }

    /**
     *
     */
    public resourceRestoreSchema(
      request: AvonRequest,
    ): OpenAPIV3.PathItemObject | undefined {
      if (this.availableForRestore && Boolean(this.softDeletes())) {
        return {
          put: {
            tags: [this.uriKey()],
            description: `Restore deleted ${this.label()} by id`,
            operationId: `restore`,
            parameters: [...this.singleResourcePathParameters(request)],
            responses: {
              ...this.authorizationResponses(),
              ...this.errorsResponses(),
              204: { $ref: '#/components/responses/EmptyResponse' },
            },
          },
        };
      }
    }

    /**
     * Get the Open API json schema for relationship fields.
     */
    public actionsSchema(request: AvonRequest): OpenAPIV3.PathsObject {
      const actions: Collection<Action> = collect(this.resolveActions(request));
      const paths = this.apis(request);

      return actions
        .mapWithKeys((action: Action): [string, OpenAPIV3.PathItemObject] => {
          const fields = new FieldCollection(action.fields(request));

          return [
            `${paths.index}/actions/${action.uriKey()}`,
            {
              post: {
                tags: [this.uriKey()],
                description: `Run the ${action.name()} on the given resources`,
                operationId: `${this.uriKey() as string}-${action.uriKey()}`,
                parameters: [
                  {
                    name: 'resources',
                    in: 'query',
                    description: 'Enter record id you want to run action on it',
                    required: !action.isStandalone(),
                    style: 'deepObject',
                    explode: true,
                    schema: {
                      type: 'array',
                      items: {
                        oneOf: [
                          { type: 'number', nullable: false, minLength: 1 },
                          { type: 'string', nullable: false },
                        ],
                      },
                      nullable: false,
                      minItems: action.isStandalone() ? 0 : 1,
                    },
                  },
                ],
                requestBody: fields.isEmpty()
                  ? undefined
                  : {
                      content: {
                        'application/json': {
                          schema: {
                            type: 'object',
                            required: fields
                              .map((field) => field.attribute)
                              .all(),
                            properties: this.formatPayloadFields(
                              request,
                              fields,
                            ),
                          },
                        },
                      },
                    },
                responses: {
                  ...this.authorizationResponses(),
                  ...this.errorsResponses(),
                  200: {
                    description: `Action ${action.name()} ran successfully`,
                    content: {
                      'application/json': {
                        schema: action.schema(request),
                      },
                    },
                  },
                },
              },
            },
          ];
        })
        .all() as unknown as Record<
        string,
        OpenAPIV3.PathItemObject | undefined
      >;
    }

    /**
     * Get the Open API json schema for relationship fields.
     */
    public associationSchema(request: AvonRequest): OpenAPIV3.PathsObject {
      const paths = this.apis(request);

      return this.availableFieldsOnForms(request)
        .withOnlyRelatableFields()
        .withoutUnfillableFields()
        .mapWithKeys((field: Relation) => {
          const relatable = field.relatedResource;

          return [
            `${paths.index}/associable/${field.attribute}`,
            {
              get: {
                tags: [this.uriKey()],
                description: `Get list of related ${
                  relatable.label() as string
                }`,

                operationId: field.attribute,
                parameters: [
                  {
                    name: 'page',
                    in: 'query',
                    description: 'The pagination page',
                    example: 1,
                    default: 1,
                    schema: {
                      type: 'integer',
                      minimum: 1,
                      nullable: true,
                    },
                  },
                  {
                    name: 'perPage',
                    in: 'query',
                    description: 'Number of items per page',
                    example: relatable.relatableSearchResults,
                    default: relatable.relatableSearchResults,
                    schema: {
                      type: 'number',
                      nullable: true,
                      enum: [relatable.relatableSearchResults],
                    },
                  },
                  ...relatable.searchParameters(request),
                  ...relatable.softDeleteParameters(request),
                  ...collect(field.availableFilters(request))
                    .unique((filter: Filter) => filter.key())
                    .all()
                    .flatMap((filter) => filter.serializeParameters(request)),
                  ...collect(field.availableOrderings(request))
                    .unique((order: Ordering) => order.key())
                    .all()
                    .flatMap((order) => order.serializeParameters(request)),
                ],

                responses: {
                  ...this.authorizationResponses(),
                  ...this.errorsResponses(),
                  200: {
                    description: `Get list of related ${
                      relatable.label() as string
                    }`,
                    content: {
                      'application/json': {
                        schema: {
                          type: 'object',
                          properties: {
                            data: {
                              type: 'array',
                              items: {
                                type: 'object',
                                properties: relatable.formatResponseFields(
                                  request,
                                  new FieldCollection(
                                    relatable.fieldsForAssociation(request),
                                  )
                                    .filterForAssociation(request)
                                    .withoutUnresolvableFields()
                                    .withoutRelatableFields(),
                                ),
                              },
                            },
                            meta: {
                              type: 'object',
                              properties: {
                                count: {
                                  type: 'integer',
                                },
                                page: {
                                  type: 'integer',
                                },
                                perPage: {
                                  type: 'integer',
                                },
                                perPageOptions: {
                                  type: 'array',
                                  uniqueItems: true,
                                  items: {
                                    type: 'integer',
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          ];
        })
        .all() as unknown as Record<
        string,
        OpenAPIV3.PathItemObject | undefined
      >;
    }

    /**
     * Get the single resource content schema.
     */
    public singleResourceContent(
      request: AvonRequest,
    ): Record<string, OpenAPIV3.MediaTypeObject> {
      return {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  authorization: {
                    type: 'object',
                    properties: {
                      authorizedToUpdate: {
                        type: 'boolean',
                        default: true,
                        description:
                          'Determines user authorized to update the resource',
                      },
                      authorizedToDelete: {
                        type: 'boolean',
                        default: true,
                        description:
                          'Determines user authorized to delete the resource',
                      },
                      authorizedToForceDelete: {
                        type: 'boolean',
                        default: true,
                        description:
                          'Determines user authorized to force-delete the resource',
                      },
                    },
                  },
                  fields: {
                    type: 'object',
                    properties: this.formatResponseFields(
                      request,
                      new FieldCollection(
                        this.fieldsForDetail(request),
                      ).filterForDetail(request, this.resource),
                    ),
                  },
                },
              },
              meta: {
                type: 'object',
              },
            },
          },
        },
      };
    }

    /**
     * Get the single resource content schema.
     */
    public reviewResourceContent(
      request: AvonRequest,
    ): Record<string, OpenAPIV3.MediaTypeObject> {
      return {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              data: {
                type: 'object',
                properties: {
                  authorization: {
                    type: 'object',
                    properties: {
                      authorizedToForceDelete: {
                        type: 'boolean',
                        default: true,
                        description:
                          'Determines user authorized to force-delete the resource',
                      },
                      authorizedToRestore: {
                        type: 'boolean',
                        default: true,
                        description:
                          'Determines user authorized to restore the resource',
                      },
                    },
                  },
                  fields: {
                    type: 'object',
                    properties: this.formatResponseFields(
                      request,
                      new FieldCollection(
                        this.fieldsForReview(request),
                      ).filterForReview(request, this.resource),
                    ),
                  },
                },
              },
              meta: {
                type: 'object',
              },
            },
          },
        },
      };
    }

    /**
     * Get the single resource path parameters.
     */
    public singleResourcePathParameters(
      request: AvonRequest,
    ): OpenAPIV3.ParameterObject[] {
      return [
        {
          name: 'resourceId',
          in: 'path',
          required: true,
          description: 'The resource primary key',
          example: 1,
          schema: { oneOf: [{ type: 'number' }, { type: 'string' }] },
        },
      ];
    }

    /**
     * Get the API paths.
     */
    public apis(request: AvonRequest): Record<string, string> {
      const basePath = request.getRequest().baseUrl;
      const resourcePath = `/${basePath}/resources/${String(
        this.uriKey(),
      )}`.replace(/\/{2,}/g, '/');

      return {
        index: resourcePath,
        detail: `${resourcePath}/{resourceId}`,
        review: `${resourcePath}/{resourceId}/review`,
        restore: `${resourcePath}/{resourceId}/restore`,
        forceDelete: `${resourcePath}/{resourceId}/force`,
        action: `${resourcePath}/actions/{actionName}`,
        association: `${resourcePath}/associable/{field}`,
      };
    }

    /**
     * Get the schema label.
     */
    public label(): string {
      return plural(slugify(this.constructor.name, ' '));
    }

    /**
     * Format the given schema for responses.
     */
    public formatResponseFields(
      request: AvonRequest,
      fields: FieldCollection,
    ): Record<string, OpenApiSchema> {
      return new FieldCollection(fields)
        .resolve(this.resource ?? this.repository().model())
        .responseSchemas(request);
    }

    /**
     * Format the given schema for responses.
     */
    public formatPayloadFields(request: AvonRequest, fields: FieldCollection) {
      return fields
        .resolve(this.resource ?? this.repository().model())
        .payloadSchemas(request);
    }

    /**
     * name
     */
    public authorizationResponses(): OpenAPIV3.ResponsesObject {
      return authorizationResponses();
    }

    /**
     * name
     */
    public errorsResponses(): OpenAPIV3.ResponsesObject {
      return errorsResponses();
    }

    /**
     * name
     */
    public validationResponses(): OpenAPIV3.ResponsesObject {
      return validationResponses();
    }

    abstract uriKey(): string;
    abstract availableFields(request: AvonRequest): FieldCollection;
    abstract perPageOptions(): number[];
    abstract availableFieldsOnForms(request: AvonRequest): FieldCollection;
    abstract resolveFilters(request: AvonRequest): Filter[];
    abstract resolveOrderings(request: AvonRequest): Ordering[];
    abstract availableFieldsOnIndexOrDetail(
      request: AvonRequest,
    ): FieldCollection;
    abstract fieldsForIndex(request: AvonRequest): Field[];
    abstract fieldsForDetail(request: AvonRequest): Field[];
    abstract fieldsForReview(request: AvonRequest): Field[];
    abstract fieldsForCreate(request: AvonRequest): Field[];
    abstract fieldsForUpdate(request: AvonRequest): Field[];
    abstract resolveActions(request: AvonRequest): Action[];
    abstract softDeletes(): boolean;
    public abstract repository(): Repository<Model>;
  }

  return ResourceSchema;
};
