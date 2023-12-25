import { Filter } from '../../Filters';
import { Ordering } from '../../Orderings';
import { RequestTypes, MatchesQueryParameters } from '../../Contracts';
import ResourceIndexRequest from './ResourceIndexRequest';

export default class AssociableRequest extends ResourceIndexRequest {
  /**
   * Indicates type of the request instance.
   */
  type(): RequestTypes {
    return RequestTypes.AssociableRequest;
  }

  /**
   * Get the filters for the request.
   */
  public filters(): MatchesQueryParameters<Filter> {
    return [];
  }

  /**
   * Get the orderings for the request.
   */
  public orderings(): MatchesQueryParameters<Ordering> {
    return [];
  }
}
