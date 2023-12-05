import Joi from 'joi';
import Text from './Text';

export default class Email extends Text {
  /**
   * The validation rules callback for creation and updates.
   */
  protected rulesSchema = Joi.string().email();

  /**
   * The validation rules callback for creation.
   */
  protected creationRulesSchema = Joi.string().email();

  /**
   * The validation rules callback for updates.
   */
  protected updateRulesSchema = Joi.string().email();
}
