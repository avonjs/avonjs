import { plural, singular } from 'pluralize';
import Resource from '../Resource';

/**
 * Guess foreign-key name for the given resource.
 */
export const guessForeignKey = (resource: Resource): string => {
  const keyName = resource.constructor.name.replace(
    /[A-Z]/g,
    (matched, offset) => (offset > 0 ? '_' : '') + matched.toLowerCase(),
  );

  return keyName + '_id';
};

/**
 * Guess relation name for the given resource.
 */
export const guessRelation = (
  resource: Resource,
  pluralize: boolean = false,
): string => {
  const relation = resource.constructor.name.replace(
    /[A-Z]/g,
    (matched, offset) => (offset > 0 ? matched : matched.toLowerCase()),
  );

  return pluralize ? plural(relation) : singular(relation);
};
