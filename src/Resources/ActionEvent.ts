import { Action } from '../Actions';
import FieldCollection from '../Collections/FieldCollection';
import { Field, Json, Text } from '../Fields';
import { Filter } from '../Filters';
import AvonRequest from '../Http/Requests/AvonRequest';
import { Ordering } from '../Orderings';
import {
  Repository,
  ActionEvent as ActionEventRepository,
} from '../Repositories';
import Resource from '../Resource';
import { Searchable } from '../contracts';

export default class ActionEvent extends Resource {
  /**
   * Get the fields available on the entity.
   */
  public fields(request: AvonRequest): Field[] {
    return [
      new Text('id').filterable().orderable().exceptOnForms(),
      new Text('model_type').filterable().orderable(),
      new Text('model_id').filterable().orderable(),
      new Text('resource_name').filterable().orderable(),
      new Text('resource_id').filterable().orderable(),
      new Json('payload').resolveUsing((value) => JSON.stringify(value)),
      new Json('changes').resolveUsing((value) => JSON.stringify(value)),
      new Json('original').resolveUsing((value) => JSON.stringify(value)),
    ];
  }

  /**
   * Get the repository.
   */
  public repository(): Repository {
    return new (class extends ActionEventRepository {
      searchables(): Searchable[] {
        return [];
      }
    })();
  }

  actionRepository(): ActionEventRepository {
    return this.repository() as ActionEventRepository;
  }
}
