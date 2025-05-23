import type { Request, Response } from 'express';

import { DateTime } from 'luxon';
import Avon from '../Avon';
import ResponsableException from '../Exceptions/ResponsableException';
import ActionIndexController from '../Http/Controllers/ActionIndexController';
import ActionStoreController from '../Http/Controllers/ActionStoreController';
import AssociableController from '../Http/Controllers/AssociableController';
import type Controller from '../Http/Controllers/Controller';
import ResourceDeleteController from '../Http/Controllers/ResourceDeleteController';
import ResourceDetailController from '../Http/Controllers/ResourceDetailController';
import ResourceForceDeleteController from '../Http/Controllers/ResourceForceDeleteController';
import ResourceIndexController from '../Http/Controllers/ResourceIndexController';
import ResourceLookupByFieldController from '../Http/Controllers/ResourceLookupByFieldController';
import ResourceRestoreController from '../Http/Controllers/ResourceRestoreController';
import ResourceReviewController from '../Http/Controllers/ResourceReviewController';
import ResourceStoreController from '../Http/Controllers/ResourceStoreController';
import ResourceUpdateController from '../Http/Controllers/ResourceUpdateController';
import SchemaController from '../Http/Controllers/SchemaController';
import ActionRequest from '../Http/Requests/ActionRequest';
import AssociableRequest from '../Http/Requests/AssociableRequest';
import type AvonRequest from '../Http/Requests/AvonRequest';
import ResourceStoreOrAttachRequest from '../Http/Requests/ResourceCreateOrAttachRequest';
import ResourceDeleteRequest from '../Http/Requests/ResourceDeleteRequest';
import ResourceDetailRequest from '../Http/Requests/ResourceDetailRequest';
import ResourceForceDeleteRequest from '../Http/Requests/ResourceForceDeleteRequest';
import ResourceIndexRequest from '../Http/Requests/ResourceIndexRequest';
import ResourceLookupByFieldRequest from '../Http/Requests/ResourceLookupByFieldRequest';
import ResourceRestoreRequest from '../Http/Requests/ResourceRestoreRequest';
import ResourceReviewRequest from '../Http/Requests/ResourceReviewRequest';
import ResourceUpdateOrUpdateAttachedRequest from '../Http/Requests/ResourceUpdateOrUpdateAttachedRequest';
import SchemaRequest from '../Http/Requests/SchemaRequest';
import type AvonResponse from '../Http/Responses/AvonResponse';
import { send } from '../helpers';
import Debug from '../support/debug';

const controllers: Record<
  string,
  {
    controller: () => Controller;
    request: (request: Request) => AvonRequest;
  }
> = {
  ResourceIndexController: {
    controller: () => new ResourceIndexController(),
    request: (request: Request) => new ResourceIndexRequest(request),
  },
  ResourceStoreController: {
    controller: () => new ResourceStoreController(),
    request: (request: Request) => new ResourceStoreOrAttachRequest(request),
  },
  ResourceDetailController: {
    controller: () => new ResourceDetailController(),
    request: (request: Request) => new ResourceDetailRequest(request),
  },
  ResourceLookupByFieldController: {
    controller: () => new ResourceLookupByFieldController(),
    request: (request: Request) => new ResourceLookupByFieldRequest(request),
  },
  ResourceUpdateController: {
    controller: () => new ResourceUpdateController(),
    request: (request: Request) =>
      new ResourceUpdateOrUpdateAttachedRequest(request),
  },
  ResourceDeleteController: {
    controller: () => new ResourceDeleteController(),
    request: (request: Request) => new ResourceDeleteRequest(request),
  },
  ResourceForceDeleteController: {
    controller: () => new ResourceForceDeleteController(),
    request: (request: Request) => new ResourceForceDeleteRequest(request),
  },
  ResourceRestoreController: {
    controller: () => new ResourceRestoreController(),
    request: (request: Request) => new ResourceRestoreRequest(request),
  },
  ResourceReviewController: {
    controller: () => new ResourceReviewController(),
    request: (request: Request) => new ResourceReviewRequest(request),
  },
  ActionIndexController: {
    controller: () => new ActionIndexController(),
    request: (request: Request) => new ActionRequest(request),
  },
  ActionStoreController: {
    controller: () => new ActionStoreController(),
    request: (request: Request) => new ActionRequest(request),
  },
  AssociableController: {
    controller: () => new AssociableController(),
    request: (request: Request) => new AssociableRequest(request),
  },
  SchemaController: {
    controller: () => new SchemaController(),
    request: (request: Request) => new SchemaRequest(request),
  },
};
// TODO: may i have to export new class instance instead of static method
// biome-ignore lint/complexity/noStaticOnlyClass:
export default class Dispatcher {
  /**
   * Dispatch incoming request to correspond controller.
   */
  public static dispatch(
    handler: string,
  ): (request: Request, response: Response) => void {
    const [controller, method] = [...handler.split('@'), '__invoke'];

    if (controllers[controller] === undefined) {
      throw Error(`AvonError: Controller ${controller} not found`);
    }

    const controllerInstance = controllers[controller].controller();

    if (typeof controllerInstance[method as keyof Controller] !== 'function') {
      throw Error(`AvonError: Invalid route handler ${controller}@${method}`);
    }

    return async (req: Request, res: Response) => {
      const logger = Debug.extend(Dispatcher.generateRequestId());
      logger.dump(
        `Dispatching request "${req.method}:${req.url}" to "${controller}"`,
      );
      const request = controllers[controller].request(req);
      // set the unique logger for incoming request
      request.setLogger(logger);
      // set the unique logger for incoming request
      request.setUser(await Avon.resolveUser(request));
      // dispatch request to the controller
      controllerInstance[method as keyof Controller](request)
        .then((response: AvonResponse) => {
          send(res, response);
          logger.dump('Response sent.');
        })
        .catch((error: Error) => {
          logger.dump(error);
          if (error instanceof ResponsableException) {
            send(res, error.toResponse());
          } else {
            Avon.handleError(error);
            res
              .status(500)
              .send({ message: error.message, name: 'InternalServerError' });
          }
        });
    };
  }

  protected static generateRequestId(): string {
    // Generate the current date with Luxon
    const date = DateTime.now().toFormat('yyLLdd'); // e.g., "20241026"
    const time = DateTime.now().toFormat('HHmmss'); // e.g., "153023"

    // Generate microsecond-like precision by combining millisecond precision with a random number
    const microseconds = Math.floor(
      DateTime.now().millisecond * 1000 + Math.random() * 1000,
    )
      .toString()
      .padStart(6, '0'); // e.g., "456789"

    // Generate a short random suffix for extra uniqueness
    const randomSuffix = Math.ceil(Math.random() * 10000)
      .toString()
      .padEnd(4, '0'); // e.g., "07"

    // Combine to form the final ID
    return `${date}-${time}-${microseconds}-${randomSuffix}`;
  }
}
