import OrderableFields from '../../Mixins/OrderableFields';
import { Ordering as AvonOrdering } from '../../Orderings';
import type Field from '../Field';

export default class Ordering extends OrderableFields(AvonOrdering) {
  constructor(public field: Field) {
    super();
  }
}
