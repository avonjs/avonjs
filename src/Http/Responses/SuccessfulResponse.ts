import AvonResponse from './AvonResponse';

export default class SuccessfulResponse extends AvonResponse {
  constructor(
    message: string = 'Your action successfully ran.',
    meta: Record<string, any> = {},
  ) {
    super(200, { message }, meta);
  }
}
