//@ts-check
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const fs = require('fs');

const { Repositories, Resource, Fields, Actions } = require('../../dist');
const { join } = require('path');
const { default: collect } = require('collect.js');
const { randomUUID } = require('crypto');
const { Fluent } = require('../../dist/Models');
const { Operator } = require('../../dist/contracts');

const stores = join(__dirname, 'stores.json');
const events = join(__dirname, 'events.json');

class ActionEvent extends Repositories.FileRepository {
  filepath() {
    return events;
  }
  searchableColumns() {
    return [];
  }

  /**
   * makeIdentifier
   */
  makeIdentifier() {
    return new Date().toISOString().substring(0, 10) + ':' + String(Date.now());
  }

  /**
   * Store multiple model's into the storage.
   */
  async insert(models) {
    // ensure log file exists
    return Promise.all(
      models.map(async (model) => {
        return this.store(
          model.setAttribute(model.getKeyName(), this.makeIdentifier()),
        );
      }),
    );
  }

  /**
   * Fill event model for successful resource store.
   */
  forResourceStore(params) {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Create',
      changes: params.resource.all(),
    });
  }

  /**
   * Fill event model for successful resource update.
   */
  forResourceUpdate(params) {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Update',
      changes: collect(params.resource.all())
        .diffAssoc(collect(params.previous.all()))
        .all(),
      original: params.previous.all(),
    });
  }

  /**
   * Fill event model for successful resource destroy.
   */
  forResourceDelete(params) {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Delete',
      changes: {},
      original: params.resource.all(),
    });
  }

  /**
   * Fill event model for successful resource restore.
   */
  forResourceRestore(params) {
    return new Fluent({
      ...this.defaultAttributes(params),
      name: 'Restore',
      changes: {},
    });
  }

  /**
   * Fill event model for successful action ran.
   */
  forActionRan(params) {
    return new Fluent({
      ...this.defaultAttributes(params),
      batch_id: params.batchId ?? randomUUID(),
      name: params.action.name(),
      original: params.previous.all(),
      changes: collect(params.resource.all())
        .diffAssoc(collect(params.previous.all()))
        .all(),
    });
  }

  /**
   * Get the default attributes for creating a new action event.
   */
  defaultAttributes(params) {
    return {
      payload: params.payload ?? {},
      resource_name: params.resourceName,
      resource_id: params.resource.getKey(),
      model_type: params.resource.constructor.name,
      model_id: params.resource.getKey(),
      changes: {},
      original: {},
      status: 'finished',
      user_id: params.userId,
      batch_id: params.batchId ?? randomUUID(),
    };
  }

  /**
   * Delete resource events for ever.
   */
  async flush(resourceName, key) {
    const events = await this.scopeResource(resourceName, key).all();

    await Promise.all(events.map((event) => this.delete(event.getKey())));

    return events;
  }

  /**
   * Limit query to the given resource.
   */
  scopeResource(resourceName, key) {
    return this.where([
      {
        key: 'resource_id',
        value: key,
        operator: Operator.eq,
      },
      {
        key: 'resource_name',
        value: resourceName,
        operator: Operator.eq,
      },
    ]);
  }
}

class StoreRepository extends Repositories.FileRepository {
  searchableColumns() {
    return [];
  }
  filepath() {
    return stores;
  }
}

const activate = new (class Activate extends Actions.Action {
  async handle(fields, models) {
    await Promise.all(
      models.map((model) => {
        new StoreRepository().update(model.setAttribute('active', true));
      }),
    );
  }
})();

const standAlone = new (class StandAlone extends Actions.Action {
  async handle(fields, models) {}
})();

class Store extends Resource {
  repository() {
    return new StoreRepository();
  }

  fields() {
    return [
      new Fields.ID(),
      new Fields.Text('name'),
      new Fields.Binary('active').default(() => false),
    ];
  }

  actionRepository() {
    return new ActionEvent();
  }

  actions(request) {
    return [activate, standAlone.standalone()];
  }
}

const app = express();

app.use(bodyParser.json());

beforeAll(() => {
  fs.writeFileSync(
    stores,
    JSON.stringify([
      { id: 1, name: 'Name 1', active: false },
      { id: 2, name: 'Name 2', active: true },
    ]),
  );
  fs.writeFileSync(events, JSON.stringify([]));
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([new Store()]);

  app.use('/api', Avon.routes(express.Router()));
});
// create storage
afterAll(() => {
  fs.unlinkSync(stores);
  fs.unlinkSync(events);
});

describe('POST resources api', () => {
  test('Could run action for single resource', () => {
    return request(app)
      .post(
        `/api/resources/${new Store().uriKey()}/actions/${activate.uriKey()}`,
      )
      .send({ resources: [1] })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body }) => {
        const event = await new ActionEvent().first([
          { key: 'resource_id', value: 1, operator: Operator.eq },
          {
            key: 'resource_name',
            value: new Store().uriKey(),
            operator: Operator.eq,
          },
          { key: 'name', value: activate.name(), operator: Operator.eq },
        ]);

        expect(event.original).toEqual({
          id: 1,
          name: 'Name 1',
          active: false,
        });
        expect(event.changes).toEqual({
          active: true,
        });
      });
  });

  test('Could log standalone action', () => {
    return request(app)
      .post(
        `/api/resources/${new Store().uriKey()}/actions/${standAlone.uriKey()}`,
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body }) => {
        const event = await new ActionEvent().first([
          {
            key: 'resource_name',
            value: new Store().uriKey(),
            operator: Operator.eq,
          },
          { key: 'name', value: standAlone.name(), operator: Operator.eq },
        ]);

        expect(event).not.toBeUndefined();
        expect(event.original).toEqual({});
        expect(event.changes).toEqual({});
      });
  });
});
