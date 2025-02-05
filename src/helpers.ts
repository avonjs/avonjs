import type { NextFunction, Request, Response } from 'express';
import type { OpenAPIV3 } from 'openapi-types';
import type {
  AnyValue,
  EvaluatorCallback,
  Model,
  ResourceEvaluatorCallback,
} from './Contracts';
import AuthenticationException from './Exceptions/AuthenticationException';
import type AvonRequest from './Http/Requests/AvonRequest';
import type { AvonResponse } from './Http/Responses';
import Resource from './Resource';

/**
 * Convert given string in to slugify version.
 */
export const slugify = (string: string, separator = '-'): string => {
  return String(string).replace(
    /[A-Z]/g,
    (matched, offset) => (offset > 0 ? separator : '') + matched.toLowerCase(),
  );
};

/**
 * Make evaluator callback for given callback.
 */
export const makeEvaluatorCallback = (
  callback: EvaluatorCallback | boolean,
): EvaluatorCallback | ResourceEvaluatorCallback => {
  return typeof callback !== 'function' ? () => callback : callback;
};

/**
 * Make evaluator callback to approve.
 */
export const approveCallback = () => makeEvaluatorCallback(true);

/**
 * Make reverse callback for given evaluator callback.
 */
export const reverseEvaluatorCallback = (
  callback: EvaluatorCallback | boolean,
): EvaluatorCallback | ResourceEvaluatorCallback => {
  const evaluatorCallback = makeEvaluatorCallback(callback);

  return (request: AvonRequest, resource?: Model) => {
    return !evaluatorCallback(request, resource);
  };
};

/**
 * Checks if the input value is nullish, which includes empty string, undefined, NaN, or null.
 */
export const isNullish = (value: AnyValue) => {
  return ['', undefined, Number.NaN, null].includes(value);
};

/**
 * Send Avon response by node response service.
 */
export const send = (res: Response, response: AvonResponse) => {
  res
    .status(response.getStatusCode())
    .set(response.getHeaders())
    .send(response.content());
};

/**
 * Handle JWT authentication error.
 */
export const handleAuthenticationError = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (err.name === 'UnauthorizedError') {
    send(res, new AuthenticationException(err).toResponse());
  } else {
    next(err);
  }
};

/**
 * Get authorization responses schema.
 */
export const authorizationResponses = (): OpenAPIV3.ResponsesObject => {
  return {
    401: {
      $ref: '#/components/responses/Unauthenticated',
    },
    403: {
      $ref: '#/components/responses/Forbidden',
    },
  };
};

/**
 * Get erros responses schema.
 */
export const errorsResponses = (): OpenAPIV3.ResponsesObject => {
  return {
    400: {
      $ref: '#/components/responses/BadRequest',
    },
    404: {
      $ref: '#/components/responses/NotFound',
    },
    405: {
      $ref: '#/components/responses/MethodNotAllowed',
    },
    500: {
      $ref: '#/components/responses/InternalServerError',
    },
  };
};

/**
 * Get validation responses schema.
 */
export const validationResponses = (): OpenAPIV3.ResponsesObject => {
  return {
    400: {
      $ref: '#/components/responses/BadRequest',
    },
    422: {
      $ref: '#/components/responses/UnprocessableContent',
    },
  };
};
