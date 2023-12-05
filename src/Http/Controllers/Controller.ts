import AvonRequest from '../Requests/AvonRequest';
import { AvonResponse } from '../Responses';

export default class Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: AvonRequest): Promise<AvonResponse> {
    throw new Error(`Invoked controller ${this.constructor.name}`);
  }
}
