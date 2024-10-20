import Avon from '../../Avon';
import type SchemaRequest from '../Requests/SchemaRequest';
import type { AvonResponse } from '../Responses';
import SchemaResponse from '../Responses/SchemaResponse';
import Controller from './Controller';

export default class SchemaController extends Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: SchemaRequest): Promise<AvonResponse> {
    return new SchemaResponse(Avon.schema(request));
  }
}
