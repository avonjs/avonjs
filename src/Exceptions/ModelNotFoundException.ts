import NotFoundException from './NotFoundException';

export default class ModelNotFoundException extends NotFoundException {
  message = 'Model not found';
}
