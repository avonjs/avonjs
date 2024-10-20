import { Ability, type Model, type SearchCollection } from '../../Contracts';
import type Resource from '../../Resource';
import type AssociableRequest from '../Requests/AssociableRequest';
import type { AvonResponse } from '../Responses';
import ResourceAssociationResponse from '../Responses/ResourceAssociationResponse';
import Controller from './Controller';

export default class AssociableController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: AssociableRequest): Promise<AvonResponse> {
    const resource = request.resource();
    const relationship = request.relatedField();

    const repository = await relationship.searchAssociable(
      request,
      request.query('withTrashed') === 'true',
    );

    const { items, count }: SearchCollection<Model> = await repository.search(
      request.string('search', ''),
      request.currentPage(),
      relationship.relatedResource.relatableSearchResults,
    );

    const relatedResource = (resource: Model): Resource => {
      return new relationship.relatedResource.constructor.prototype.constructor(
        resource,
      );
    };
    const resources = await Promise.all(
      items
        .map((item: Model) => relatedResource(item))
        .filter((associable: Resource) => {
          return resource.authorizedTo(request, Ability.add, [associable]);
        }),
    );

    return new ResourceAssociationResponse(
      await Promise.all(
        resources.map((resource: Resource) => {
          return resource.serializeForAssociation(request);
        }),
      ),
      {
        count,
        currentPage: request.currentPage(),
        perPage: relationship.relatedResource.relatableSearchResults,
        perPageOptions: [relationship.relatedResource.relatableSearchResults],
      },
    );
  }
}
