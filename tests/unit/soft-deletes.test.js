//@ts-check

const { Repositories, SoftDeletes } = require('../../dist');
const { Operator } = require('../../dist/contracts');

const items = [{ id: 1 }, { id: 2, deleted_at: new Date().toString() }];

class RepositoryWithSoftDeletes extends SoftDeletes(Repositories.Collection) {
  searchableColumns() {
    return [];
  }
  resolveItems() {
    return items;
  }
}
const where = { key: 'id', operator: Operator.not, value: null };

describe('SoftDeletes mixins', () => {
  test('with trashed items', async () => {
    const repository = new RepositoryWithSoftDeletes().where(where);
    const models = await repository.withTrashed().all();

    expect(repository.withTrashed().getWheres()).toEqual([where]);
    expect(models.map((model) => model.all())).toEqual(items);
  });

  test('without trashed items', async () => {
    const repository = new RepositoryWithSoftDeletes().where(where);
    const models = await repository.all();

    expect(repository.getWheres()).toEqual([
      repository.scopeSoftDelete(),
      where,
    ]);
    expect(models.map((model) => model.all())).toEqual([items[0]]);
  });

  test('only trashed items', async () => {
    const repository = new RepositoryWithSoftDeletes().where(where);

    const models = await repository.onlyTrashed().all();

    expect(repository.onlyTrashed().getWheres()).toEqual([
      where,
      repository.scopeTrashedRecords(),
    ]);
    expect(models.map((model) => model.all())).toEqual([items[1]]);
  });
});
