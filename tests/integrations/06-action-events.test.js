//@ts-check
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');
const fs = require('fs');

const {
  Repositories,
  Resource,
  Fields,
  SoftDeletes,
  FillsActionEvents,
} = require('../../dist');
const { join } = require('path');
const { Operator } = require('../../dist/Contracts');
const { Fluent } = require('../../dist/Models');
const filepath = join(__dirname, 'events.json');

class ActionEvent extends FillsActionEvents(Repositories.File) {
  filepath() {
    return filepath;
  }
  searchableColumns() {
    return [];
  }
}

class Post extends Resource {
  repository() {
    return new (class extends SoftDeletes(Repositories.Collection) {
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
        expect(actionEvent.getAttribute('payload')).toEqual({});
        expect(actionEvent.getAttribute('original')).toEqual({});
        expect(actionEvent.getAttribute('changes')).toEqual({});
      });
  });

  test('Could flush logs for deleted resources', async () => {
    await new ActionEvent().store(
      new ActionEvent().forResourceStore({
        resource: new Fluent({ id: 2, name: 'Post 2' }),
        resourceName: resource.resourceName(),
        payload: {},
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
            value: 2,
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
