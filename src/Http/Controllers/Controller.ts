import type AvonRequest from '../Requests/AvonRequest';
import type { AvonResponse } from '../Responses';

export default class Controller {
  /**
   * Default route handler
   */
  public async __invoke(request: AvonRequest): Promise<AvonResponse> {
    throw new Error(`Invoked controller ${this.constructor.name}`);
  }
}
