import NotFoundException from './NotFoundException';

export default class ActionNotFoundException extends NotFoundException {
  message = 'Action not found';
}
