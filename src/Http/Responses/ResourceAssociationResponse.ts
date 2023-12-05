import AvonResponse from './AvonResponse';

export default class ResourceAssociationResponse extends AvonResponse {
  constructor(
    data: Array<Record<string, any>>,
    meta: Record<string, any> = {},
  ) {
    super(200, data, meta);
  }
}
