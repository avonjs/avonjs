//@ts-check
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const fs = require('fs');

const { Repositories, Resource, Fields, SoftDeletes } = require('../../dist');
const { join } = require('path');
const { Operator } = require('../../dist/contracts');
const { Fluent } = require('../../dist/Models');
const { default: collect } = require('collect.js');
const { randomUUID } = require('crypto');
const filepath = join(__dirname, 'events.json');

class ActionEvent extends Repositories.FileRepository {
  filepath() {
    return filepath;
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

class Post extends Resource {
  repository() {
    return new (class extends SoftDeletes(Repositories.CollectionRepository) {
      resolveItems() {
        return [
          { id: 1, name: 'Post 1' },
          { id: 2, name: 'Post 2', deleted_at: new Date().toISOString() },
        ];
      }
      searchableColumns() {
        return [];
      }
    })();
  }

  fields() {
    return [new Fields.ID(), new Fields.Text('name')];
  }

  actionRepository() {
    return new ActionEvent();
  }
}

const resource = new Post();
const app = express();

app.use(bodyParser.json());

beforeAll(() => {
  fs.writeFileSync(filepath, '[]');

  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  Avon.resolveUserUsing(() => new Fluent({ id: 1 }));

  app.use('/api', Avon.routes(express.Router()));
});
// create storage
afterAll(() => fs.unlinkSync(filepath));

describe('action event logs', () => {
  test('Could log resource creation', () => {
    const name = new Date().toString();
    return request(app)
      .post(`/api/resources/${resource.uriKey()}`)
      .expect('Content-Type', /json/)
      .send({ name })
      .expect(201)
      .then(async ({ body: { data } }) => {
        const actionEvent = await new ActionEvent().first([
          {
            key: 'resource_id',
            operator: Operator.eq,
            value: data.fields.id,
          },
          {
            key: 'resource_name',
            operator: Operator.eq,
            value: resource.uriKey(),
          },
          {
            key: 'name',
            operator: Operator.eq,
            value: 'Create',
          },
        ]);

        expect(actionEvent).not.toBeUndefined();
        expect(actionEvent.getAttribute('user_id')).toEqual(1);
        expect(actionEvent.getAttribute('payload')).toEqual({ name });
        expect(actionEvent.getAttribute('original')).toEqual({});
        expect(actionEvent.getAttribute('changes')).toEqual({
          id: data.fields.id,
          name,
        });
      });
  });

  test('Could log resource update', () => {
    const name = new Date().toString();
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .send({ name })
      .expect(200)
      .then(async () => {
        const actionEvent = await new ActionEvent().first([
          {
            key: 'resource_id',
            operator: Operator.eq,
            value: 1,
          },
          {
            key: 'resource_name',
            operator: Operator.eq,
            value: resource.uriKey(),
          },
          {
            key: 'name',
            operator: Operator.eq,
            value: 'Update',
          },
        ]);
        expect(actionEvent).not.toBeUndefined();
        expect(actionEvent.getAttribute('user_id')).toEqual(1);
        expect(actionEvent.getAttribute('payload')).toEqual({ name });
        expect(actionEvent.getAttribute('original')).toEqual({
          id: 1,
          name: 'Post 1',
        });
        expect(actionEvent.getAttribute('changes')).toEqual({ name });
      });
  });

  test('Could log resource delete', () => {
    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/1`)
      .expect(204)
      .then(async () => {
        const actionEvent = await new ActionEvent().first([
          {
            key: 'resource_id',
            operator: Operator.eq,
            value: 1,
          },
          {
            key: 'resource_name',
            operator: Operator.eq,
            value: resource.uriKey(),
          },
          {
            key: 'name',
            operator: Operator.eq,
            value: 'Delete',
          },
        ]);
        expect(actionEvent).not.toBeUndefined();
        expect(actionEvent.getAttribute('user_id')).toEqual(1);
        expect(actionEvent.getAttribute('payload')).toEqual({});
        expect(actionEvent.getAttribute('original')).toEqual({
          id: 1,
          name: 'Post 1',
        });
        expect(actionEvent.getAttribute('changes')).toEqual({});
      });
  });

  test('Could log resource restore', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/2/restore`)
      .expect(204)
      .then(async () => {
        const actionEvent = await new ActionEvent().first([
          {
            key: 'resource_id',
            operator: Operator.eq,
            value: 2,
          },
          {
            key: 'resource_name',
            operator: Operator.eq,
            value: resource.uriKey(),
          },
          {
            key: 'name',
            operator: Operator.eq,
            value: 'Restore',
          },
        ]);
        expect(actionEvent).not.toBeUndefined();
        expect(actionEvent.getAttribute('user_id')).toEqual(1);
        expect(actionEvent.getAttribute('payload')).toEqual({});
        expect(actionEvent.getAttribute('original')).toEqual({});
        expect(actionEvent.getAttribute('changes')).toEqual({});
      });
  });

  test('Could flush logs for deleted resources', async () => {
    await await new ActionEvent().store(
      new ActionEvent().forResourceStore({
        resource: new Fluent({ id: 100, name: 'Post 100' }),
        resourceName: resource.resourceName(),
      }),
    );

    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/2/force`)
      .expect(204)
      .then(async () => {
        const actionEvent = await new ActionEvent().first([
          {
            key: 'resource_id',
            operator: Operator.eq,
            value: 100,
          },
          {
            key: 'resource_name',
            operator: Operator.eq,
            value: resource.uriKey(),
          },
        ]);
        expect(actionEvent).toBeUndefined();
      });
  });
});
