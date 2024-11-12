import { plural, singular } from 'pluralize';
import Avon from '../Avon';
import { RuntimeException } from '../Exceptions';
import type Resource from '../Resource';

import assert from 'node:assert';

/**
 * Guess foreign-key name for the given resource.
 */
export const guessForeignKey = (resource: Resource): string => {
  const keyName = resource.constructor.name.replace(
    /[A-Z]/g,
    (matched, offset) => (offset > 0 ? '_' : '') + matched.toLowerCase(),
  );

  return `${keyName}_id`;
};

/**
 * Guess relation name for the given resource.
 */
export const guessRelation = (
  resource: Resource,
  pluralize = false,
): string => {
  const relation = resource.constructor.name.replace(
    /[A-Z]/g,
    (matched, offset) => (offset > 0 ? matched : matched.toLowerCase()),
  );

  return pluralize ? plural(relation) : singular(relation);
};

/**
 * Guess relation name for the given resource name.
 */
export const guessRelationForKey = (
  resource: string,
  pluralize = false,
): string => {
  const relatedResource = Avon.resourceForKey(resource);

  assert(
    relatedResource,
    new RuntimeException(
      `Resource '${resource}' not found for relationship ${resource}`,
    ),
  );

  return guessRelation(relatedResource, pluralize);
};
