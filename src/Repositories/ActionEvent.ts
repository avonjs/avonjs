import {
  type ActionEventRepository,
  type Model,
  Operator,
  type Searchable,
  type Where,
} from '../Contracts';
import FillsActionEvents from '../Mixins/FillsActionEvents';
import type { Fluent } from '../Models';
import CollectionRepository from './CollectionRepository';

export default class ActionEvent
  extends FillsActionEvents(CollectionRepository)
  implements ActionEventRepository<Model>
{
  /**
   * Get key name of the item.
   */
  searchableColumns(): Searchable[] {
    return [];
  }

  /**
   * Store given model into the storage.
   */
  async update(model: Fluent): Promise<Fluent> {
    throw new Error('Update action event is not possible.');
  }

  /**
   * Apply the where constraint on the collection item.
   */
  public checkAgainstWhere(item: Fluent, where: Where): boolean {
    const value = Array.isArray(where.value)
      ? where.value
      : String(where.value);
    const resourceValue = String(item.getAttribute(where.key));

    switch (where.operator) {
      case Operator.in:
      case Operator.eq:
        return (Array.isArray(where.value) ? where.value : [where.value]).some(
          (value) => value === resourceValue,
        );
      case Operator.lte:
        return resourceValue <= value;
      case Operator.gte:
        return resourceValue >= value;
      case Operator.not:
        return resourceValue !== value;
      case Operator.lt:
        return resourceValue < value;
      case Operator.gt:
        return resourceValue > value;
      default:
        return true;
    }
  }
}
