import NotFoundException from './NotFoundException';

export default class ResourceNotFoundException extends NotFoundException {
  message = 'Resource not found';
}
