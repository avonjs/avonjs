import Avon from '../Avon';
import { RuntimeException } from '../Exceptions';
import AvonRequest from '../Http/Requests/AvonRequest';
import Resource from '../Resource';
import { Model } from '../Contracts';
import HasManyOrOne from './HasManyOrOne';
import { guessRelation } from './ResourceRelationshipGuesser';

export default class HasMany extends HasManyOrOne {
  constructor(resource: string, relation?: string) {
    if (relation === undefined) {
      const relatedResource = Avon.resourceForKey(resource);

      RuntimeException.when(
        relatedResource === undefined,
        `Resource '${resource}' not found for relationship ${
          relation ?? resource
        }`,
      );

      relation = guessRelation(relatedResource as Resource, true);
    }

    super(resource, relation);
  }

  /**
   * Hydrate the given attribute on the model based on the incoming request.
   */
  public fill<TModel extends Model>(request: AvonRequest, model: TModel): any {}

  /**
   * Get the value considered as null.
   */
  public nullValue(): any {
    return [];
  }
}
