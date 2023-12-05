import AvonRequest from './Http/Requests/AvonRequest';
import {
  EvaluatorCallback,
  ResourceEvaluatorCallback,
  Model,
} from './contracts';

/**
 * Convert given string in to slugify version.
 */
export const slugify = (string: string, separator: string = '-'): string => {
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
export const isNullish = (value: any) => {
  return ['', undefined, NaN, null].includes(value);
};
