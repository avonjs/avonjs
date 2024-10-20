import { Action } from '../Actions';
import FieldCollection from '../Collections/FieldCollection';
import { type Field, Json, Text } from '../Fields';
import { Filter } from '../Filters';
import type AvonRequest from '../Http/Requests/AvonRequest';
import { Ordering } from '../Orderings';
import {
  ActionEvent as ActionEventRepository,
  type Repository,
} from '../Repositories';
import Resource from '../Resource';

export default class ActionEvent extends Resource {
  /**
   * Get the fields available on the entity.
   */
  public fields(request: AvonRequest): Field[] {
    return [
      new Text('id').filterable().orderable().exceptOnForms(),
      new Text('name').filterable().orderable(),
      new Text('model_type').filterable().orderable(),
      new Text('model_id').filterable().orderable(),
      new Text('resource_name').filterable().orderable(),
      new Text('resource_id').filterable().orderable(),
      new Json('payload').nullable(),
      new Json('changes').nullable(),
      new Json('original').nullable(),
    ];
  }

  /**
   * Get the repository.
   */
  public repository(): Repository {
    return new ActionEventRepository();
  }

  actionRepository(): ActionEventRepository {
    return this.repository() as ActionEventRepository;
  }
}
