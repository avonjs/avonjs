import NotFoundException from './NotFoundException';

export default class FieldNotFoundException extends NotFoundException {
  message = 'Field not found';
}
