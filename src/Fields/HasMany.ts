import type { AnyValue, Model } from '../Contracts';
import type AvonRequest from '../Http/Requests/AvonRequest';
import HasManyOrOne from './HasManyOrOne';
import { guessRelationForKey } from './ResourceRelationshipGuesser';

export default class HasMany extends HasManyOrOne {
  constructor(resource: string, relation?: string) {
    super(resource, relation ?? guessRelationForKey(resource, true));
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fill<TModel extends Model>(
    request: AvonRequest,
    model: TModel,
  ): AnyValue {}

  /**
   * Get the value considered as null.
   */
  public nullValue(): AnyValue {
    return [];
  }
}
