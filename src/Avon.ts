import { readdirSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import express, { IRouterHandler, type Request, type Response } from 'express';
import { type Params, expressjwt } from 'express-jwt';
import Joi, { type AnySchema } from 'joi';
import { type SignOptions, sign } from 'jsonwebtoken';
import type { OpenAPIV3 } from 'openapi-types';
import FieldCollection from './Collections/FieldCollection';
import { ResourceCollection } from './Collections/ResourceCollection';
import type {
  AttemptCallback,
  Auth,
  Dictionary,
  ErrorHandler,
  Optional,
  PrimaryKey,
  UserResolver,
} from './Contracts';
import {
  AuthenticationException,
  NotFoundException,
  ResponsableException,
} from './Exceptions';
import ValidationException from './Exceptions/ValidationException';
import { Email, type Field, Text } from './Fields';
import LoginRequest from './Http/Requests/Auth/LoginRequest';
import type AvonRequest from './Http/Requests/AvonRequest';
import type { AvonResponse } from './Http/Responses';
import LoginResponse from './Http/Responses/Auth/LoginResponse';
import { Fluent } from './Models';
import Resource from './Resource';
import RouteRegistrar from './Route/RouteRegistrar';
import {
  errorsResponses,
  handleAuthenticationError,
  send,
  validationResponses,
} from './helpers';
import Logger from './support/debug';
// TODO: may i have to export new class instance instead of static method
// biome-ignore lint/complexity/noStaticOnlyClass:
export default class Avon {
  /**
   * Indicates application current version.
   */
  protected static VERSION = '3.5.0';

  /**
   * Array of available resources.
   */
  protected static resourceInstances: Resource[] = [];

  /**
   * Map of available resources.
   */
  protected static resourceMap: Dictionary<Resource> = {};

  /**
   * The error handler callback.
   */
  protected static errorHandler: ErrorHandler = (error) => console.error(error);

  /**
   * The user resolver callback.
   */
  protected static userResolver: UserResolver = () => null;

  /**
   * Extended swagger paths.
   */
  protected static paths: OpenAPIV3.PathsObject = {};

  /**
   * List of routes without authorization.
   */
  protected static excepts: Array<string | RegExp> = [
    /.*\/schema/,
    /.*\/login/,
  ];

  /**
   * The login attempt callback.
   */
  protected static attemptCallback: AttemptCallback = async () => undefined;

  /**
   * Set application secret key.
   */
  protected static appKey = 'Avon';

  /**
   * Indicates JWT params.
   */
  protected static jwtSignOptions: SignOptions = {
    algorithm: 'HS256',
  };

  /**
   * Indicates JWT verify params.
   */
  protected static jwtVerifyOptions: Params;

  /**
   * The login attempt callback.
   */
  protected static authFields: Field[] = [
    new Email().default(() => 'zarehesmaiel@gmail.com'),
    new Text('password').default(() => 'zarehesmaiel@gmail.com'),
  ];

  /**
   * Extended swagger info.
   */
  protected static info: OpenAPIV3.InfoObject = {
    version: Avon.version(),
    title: 'My Application API',
    description: 'Another Avonjs Application',
    contact: {
      name: 'Ismail Zare',
      email: 'zarehesmaiel@gmail.com',
    },
  };

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

    Logger.dump(
      'Resources registered: %O',
      Avon.resourceCollection().keys().implode(', '),
    );

    return Avon;
  }

  /**
   * Find resource for given uriKey.
   */
  public static resourceForKey(key: string): Optional<Resource> {
    if (Avon.resourceMap[key] === undefined) {
      Avon.resourceMap[key] = Avon.resourceCollection().first(
        (resource: Resource) => resource.uriKey() === key,
      );
    }

    return Avon.resourceMap[key];
  }

  /**
   * Get collection of available resources.
   */
  public static resourceCollection() {
    return new ResourceCollection(Avon.resourceInstances);
  }

  /**
   * Get express instance.
   */
  public static routes(withAuthentication = false) {
    return Avon.express(withAuthentication);
  }

  /**
   * Get express instance.
   */

  public static express(
    withAuthentication = false,
    middlewares: Array<express.RequestHandler> = [],
  ) {
    const app = express();
    app.set('query parser', 'extended');

    // Apply provided middlewares
    middlewares.forEach((middleware) => app.use(middleware));
    // Define an auth-specific router
    const authRouter = express.Router();

    if (withAuthentication) {
      // Login route should be available before authentication middleware
      authRouter.post('/login', Avon.login);

      // Apply authentication middleware only after login
      app.use(Avon.expressjwt());
      app.use(handleAuthenticationError);
    }
    // Register other application routes
    new RouteRegistrar(authRouter).register();
    // Register the authRouter under '/api'
    app.use(authRouter);

    return app;
  }

  /**
   * Get JWT middleware.
   */
  public static expressjwt() {
    const verifyOptions = Object.assign(
      { secret: Avon.appKey, algorithms: ['HS256'] },
      Avon.jwtVerifyOptions,
    );

    return expressjwt(verifyOptions).unless({ path: Avon.excepts });
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
   * Get the user id.
   */
  public static userId(request: AvonRequest): Optional<PrimaryKey> {
    return (request.getRequest().auth as Auth)?.id;
  }

  /**
   * Resolve the user for incoming request to share in the app.
   */
  public static resolveUser(request: AvonRequest) {
    return Avon.userResolver(request);
  }

  /**
   * Set the user resolver callback.
   */
  public static resolveUserUsing(userResolver: UserResolver) {
    Avon.userResolver = userResolver;

    return Avon;
  }

  /**
   * Register resource from given path.
   */
  public static resourceIn(path: string) {
    Logger.dump(`Searching resources in directory: ${path}`);
    const files = readdirSync(path);
    const resources: Resource[] = [];
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
        resources.push(new resourceClass());
      }
    }
    // register resources
    if (resources.length) {
      Logger.dump(`Registering resources from directory: ${path}`);
      Avon.resources(resources);
    } else {
      Logger.dump(`No resources found in directory: ${path}`);
    }

    return Avon;
  }

  /**
   * Set login fields.
   */
  public static credentials(authFields: Field[]) {
    Avon.authFields = authFields;

    return Avon;
  }

  /**
   * Get login fields.
   */
  public static fieldsForLogin() {
    return new FieldCollection(Avon.authFields);
  }

  /**
   * Set JWT secret.
   */
  public static key(appKey: string) {
    Avon.appKey = appKey;

    return Avon;
  }

  /**
   * Extend swagger paths.
   */
  public static extend(paths: OpenAPIV3.PathsObject) {
    Avon.paths = paths;

    return Avon;
  }

  /**
   * Extend swagger paths.
   */
  public static describe(info: OpenAPIV3.InfoObject) {
    Avon.info = { ...Avon.info, ...info };

    return Avon;
  }

  /**
   * Set the JWT sign options.
   */
  public static signOptions(signOptions: SignOptions) {
    Avon.jwtSignOptions = { ...Avon.jwtSignOptions, ...signOptions };

    return Avon;
  }

  /**
   * Set the JWT verify options.
   */
  public static verifyOptions(verifyOptions: Params) {
    Avon.jwtVerifyOptions = { ...Avon.jwtVerifyOptions, ...verifyOptions };

    return Avon;
  }

  /**
   * Set the JWT options.
   */
  public static except(path: string | RegExp) {
    Avon.excepts.push(path);

    return Avon;
  }

  /**
   * Set attempt callback.
   */
  public static attemptUsing(attemptCallback: AttemptCallback) {
    Avon.attemptCallback = attemptCallback;

    return Avon;
  }

  /**
   * Handle login request.
   */
  public static async login(req: Request, res: Response) {
    const request = new LoginRequest(req);
    const payload = new Fluent();
    // validate credentials
    await Avon.performValidation(request)
      .then(() => {
        // resolve credentials
        Avon.fieldsForLogin().each((field) => field.fill(request, payload));
        // attempt login
        Avon.attempt(payload.getAttributes())
          .then((response) => send(res, response))
          .catch((error) => {
            if (error instanceof ResponsableException) {
              send(res, error.toResponse());
            } else {
              Avon.handleError(error);
              res
                .status(500)
                .send({ message: error.message, name: 'InternalServerError' });
            }
          });
      })
      .catch((error) => {
        send(res, new ValidationException(error).toResponse());
      });
  }

  /**
   * Perform login request validation.
   */
  public static async performValidation(request: LoginRequest) {
    await Joi.object(
      Avon.fieldsForLogin()
        .map((field) => field.getRules(request))
        .flatMap((rules) => Object.keys(rules).map((key) => [key, rules[key]]))
        .mapWithKeys<AnySchema>((rules: [string, AnySchema]) => rules)
        .all(),
    ).validateAsync(request.all(), { abortEarly: false });
  }

  /**
   * Set attempt callback.
   */
  public static async attempt(
    payload: Dictionary<unknown>,
  ): Promise<AvonResponse> {
    try {
      const user = await Avon.attemptCallback(payload);

      NotFoundException.unless(user);

      return new LoginResponse({ token: Avon.sign(user) });
    } catch (err) {
      Logger.error(err);

      throw new AuthenticationException();
    }
  }

  /**
   * Make JWT token.
   */
  public static sign(payload: Auth) {
    return sign(payload, Avon.appKey, Avon.jwtSignOptions);
  }

  /**
   * Get the schema for open API.
   */
  public static schema(request: AvonRequest): OpenAPIV3.Document {
    return {
      openapi: '3.0.0',
      security: [{ BearerAuth: [] }],
      paths: Avon.resourceCollection().reduce(
        (paths, resource) => Object.assign({}, paths, resource.schema(request)),
        { ...Avon.paths, ...Avon.loginSchema(request) },
      ),
      info: Avon.info,
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
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
          Unauthenticated: {
            description: 'The user is unauthenticated.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 401 },
                    message: {
                      type: 'string',
                      default: 'The user is unauthenticated.',
                    },
                    name: { type: 'string', default: 'Unauthenticated' },
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
          BadRequest: {
            description: 'Bad request error.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 400 },
                    message: {
                      type: 'string',
                      default: 'Request payload are invalid.',
                    },
                    name: { type: 'string', default: 'BadRequest' },
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
          MethodNotAllowed: {
            description: 'Method not allowed error.',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'number', default: 405 },
                    message: {
                      type: 'string',
                      default:
                        'The requested method is not supported for this endpoint.',
                    },
                    name: { type: 'string', default: 'MethodNotAllowed' },
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
        },
        schemas: {
          PrimaryKey: {
            anyOf: [{ type: 'number' }, { type: 'string' }],
          },
        },
      },
    };
  }

  /**
   * Get the login swagger schema.
   */
  public static loginSchema(request: AvonRequest): OpenAPIV3.PathsObject {
    const fields = Avon.fieldsForLogin();

    return {
      [`${request.getRequest().baseUrl}/login`]: {
        post: {
          tags: ['auth'],
          description: 'Login to get JWT token',
          operationId: 'attempt',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: fields.map((field) => field.attribute).all(),
                  properties: fields.payloadSchemas(request),
                },
              },
            },
          },
          responses: {
            ...errorsResponses(),
            ...validationResponses(),
            200: {
              description: 'Get JWT token',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'object',
                        properties: {
                          token: { type: 'string' },
                          meta: { type: 'object' },
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
