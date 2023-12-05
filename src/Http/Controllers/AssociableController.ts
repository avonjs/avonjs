import FieldNotFoundException from '../../Exceptions/FieldNotFoundException';
import Resource from '../../Resource';
import { SearchCollection, Model, Ability } from '../../contracts';
import AssociableRequest from '../Requests/AssociableRequest';
import { AvonResponse } from '../Responses';
import ResourceAssociationResponse from '../Responses/ResourceAssociationResponse';
import Controller from './Controller';

export default class AssociableController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: AssociableRequest): Promise<AvonResponse> {
    const resource = request.resource();
    const relationship = resource
      .availableFieldsOnForms(request)
      .withOnlyRelatableFields()
      .findFieldByAttribute(request.route('field') as string);

    FieldNotFoundException.unless(relationship);

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
      resources.map((resource: Resource) => {
        return resource.serializeForAssociation(request);
      }),
      {
        count,
        currentPage: request.currentPage(),
        perPage: relationship.relatedResource.relatableSearchResults,
        perPageOptions: [relationship.relatedResource.relatableSearchResults],
      },
    );
  }
}
