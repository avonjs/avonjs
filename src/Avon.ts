import collect, { Collection } from 'collect.js';
import { OpenAPIV3 } from 'openapi-types';
import RouteRegistrar from './Route/RouteRegistrar';
import { Router } from 'express';
import { extname, join } from 'path';
import { readdirSync, statSync } from 'fs';
import Resource from './Resource';
import AvonRequest from './Http/Requests/AvonRequest';
import { ErrorHandler, Model, UserResolver } from './contracts';

export default class Avon {
  /**
   * Indicates application current version.
   */
  protected static VERSION = '1.0.0';

  /**
   * Array of available resources.
   */
  protected static resourceInstances: Resource[] = [];

  /**
   * The error handler callback.
   */
  protected static errorHandler: ErrorHandler = (error) => console.log(error);

  /**
   * The error handler callback.
   */
  protected static resolveUser: UserResolver = () => undefined;

  /**
   * Get the Avon version.
   */
  public static version() {
    return Avon.VERSION;
  }

  /**
   * Register array of new resources.
   */
  public static resources(resources: Resource[] = []): Avon {
    Avon.resourceInstances = [...Avon.resourceInstances, ...resources];

    return Avon;
  }

  /**
   * Find resource for given uriKey.
   */
  public static resourceForKey(key?: string): Resource | undefined {
    return Avon.resourceCollection().first(
      (resource: Resource) => resource.uriKey() === key,
    );
  }

  /**
   * Get collection of available resources.
   */
  public static resourceCollection(): Collection<Resource> {
    return collect(Avon.resourceInstances);
  }

  /**
   * Register API routes.
   */
  public static routes(router: Router): Router {
    const routes = new RouteRegistrar(router);

    routes.register();

    return router;
  }

  /**
   * Handle the given error.
   */
  public static handleError(error: Error): Avon {
    Avon.errorHandler(error);

    return Avon;
  }

  /**
   * Handle the given error.
   */
  public static handleErrorUsing(errorHandler: ErrorHandler): Avon {
    Avon.errorHandler = errorHandler;

    return Avon;
  }

  /**
   * Set callback to resolve user identifier.
   */
  public static resolveUserUsing(resolveUser: UserResolver): Avon {
    Avon.resolveUser = resolveUser;

    return Avon;
  }

  /**
   * Get the user.
   */
  public static user(request: AvonRequest): Model | undefined {
    return this.resolveUser(request);
  }

  /**
   * Get the user id.
   */
  public static userId(request: AvonRequest): string | number | undefined {
    return this.resolveUser(request)?.getKey();
  }

  /**
   * Register resource from given path.
   */
  public static resourceIn(path: string) {
    const files = readdirSync(path);
    // check paths
    for (const file of files) {
      const filePath = join(path, file);
      const stat = statSync(filePath);
      // check sub directories
      if (stat.isDirectory()) {
        Avon.resourceIn(filePath);
        continue;
      }
      // check file type
      if (!['.js', '.ts'].includes(extname(file))) {
        continue;
      }

      const resourceClass = require(filePath).default || require(filePath);
      // validate resource
      if (resourceClass.prototype instanceof Resource) {
        Avon.resources([new resourceClass()]);
      }
    }

    return Avon;
  }

  /**
   * Get the schema for open API.
   */
  public static schema(request: AvonRequest): OpenAPIV3.Document {
    return {
      openapi: '3.0.0',
      paths: Avon.resourceCollection().reduce((paths, resource) => {
        return {
          ...paths,
          ...resource.schema(request),
        };
      }, {}),
      info: {
        title: 'My Application API',
        // description: 'This is a sample server for a pet store.',
        // termsOfService: 'https://example.com/terms/',
        // contact: {
        //   name: 'API Support',
        //   url: 'https://www.example.com/support',
        //   email: 'support@example.com',
        // },
        // license: {},
        version: '1.0.1',
      },
      components: {
        responses: {
          Forbidden: {
            description: 'This action is unauthorized.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 403 },
                    message: {
                      type: 'string',
                      default: 'This action is unauthorized.',
                    },
                    name: { type: 'string', default: 'Forbidden' },
                    meta: {
                      type: 'object',
                      properties: {
                        stack: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          NotFound: {
            description: 'Requested resource not found.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 404 },
                    message: {
                      type: 'string',
                      default: 'Requested resource not found.',
                    },
                    name: { type: 'string', default: 'NotFound' },
                    meta: {
                      type: 'object',
                      properties: {
                        stack: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          InternalServerError: {
            description: 'Internal server error.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 500 },
                    message: {
                      type: 'string',
                      default: 'Something went wrong.',
                    },
                    name: { type: 'string', default: 'InternalServerError' },
                    meta: {
                      type: 'object',
                      properties: {
                        stack: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          UnprocessableContent: {
            description: 'Validation failed.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 422 },
                    message: {
                      type: 'string',
                      default: 'The given data was invalid.',
                    },
                    name: { type: 'string', default: 'UnprocessableContent' },
                    meta: {
                      type: 'object',
                      properties: {
                        errors: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
          EmptyResponse: {
            description: 'Nothing to show',
            content: {
              'application/json': {},
            },
          },
        },
      },
    };
  }
}
