import { Request, Response } from 'express';

import ActionIndexController from '../Http/Controllers/ActionIndexController';
import ActionRequest from '../Http/Requests/ActionRequest';
import ActionStoreController from '../Http/Controllers/ActionStoreController';
import AvonResponse from '../Http/Responses/AvonResponse';
import Controller from '../Http/Controllers/Controller';
import ResourceDeleteController from '../Http/Controllers/ResourceDeleteController';
import ResourceDeleteRequest from '../Http/Requests/ResourceDeleteRequest';
import ResourceDetailController from '../Http/Controllers/ResourceDetailController';
import ResourceDetailRequest from '../Http/Requests/ResourceDetailRequest';
import ResourceForceDeleteController from '../Http/Controllers/ResourceForceDeleteController';
import ResourceForceDeleteRequest from '../Http/Requests/ResourceForceDeleteRequest';
import ResourceIndexController from '../Http/Controllers/ResourceIndexController';
import ResourceIndexRequest from '../Http/Requests/ResourceIndexRequest';
import ResourceRestoreController from '../Http/Controllers/ResourceRestoreController';
import ResourceRestoreRequest from '../Http/Requests/ResourceRestoreRequest';
import ResourceReviewController from '../Http/Controllers/ResourceReviewController';
import ResourceReviewRequest from '../Http/Requests/ResourceReviewRequest';
import ResourceStoreController from '../Http/Controllers/ResourceStoreController';
import ResourceStoreOrAttachRequest from '../Http/Requests/ResourceCreateOrAttachRequest';
import ResourceUpdateController from '../Http/Controllers/ResourceUpdateController';
import ResourceUpdateOrUpdateAttachedRequest from '../Http/Requests/ResourceUpdateOrUpdateAttachedRequest';
import ResponsableException from '../Exceptions/ResponsableException';
import SchemaController from '../Http/Controllers/SchemaController';
import SchemaRequest from '../Http/Requests/SchemaRequest';
import AssociableController from '../Http/Controllers/AssociableController';
import AssociableRequest from '../Http/Requests/AssociableRequest';
import Avon from '../Avon';
import AvonRequest from '../Http/Requests/AvonRequest';

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

    return (req: Request, res: Response) => {
      const request = controllers[controller].request(req);

      controllerInstance[method as keyof Controller](request)
        .then((response: AvonResponse) => {
          res
            .status(response.getStatusCode())
            .set(response.getHeaders())
            .send(response.content());
        })
        .catch((error: Error) => {
          if (error instanceof ResponsableException) {
            const response = error.toResponse(request);

            res
              .status(response.getStatusCode())
              .set(response.getHeaders())
              .send(response.content());
          } else {
            Avon.handleError(error);
            res
              .status(500)
              .send({ message: error.message, name: 'InternalServerError' });
          }
        });
    };
  }
}
