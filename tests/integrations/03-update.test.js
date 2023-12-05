//@ts-check
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const { Repositories, Resource, Fields } = require('../../dist');
const { Fluent } = require('../../dist/Models');
const targetData = { id: Date.now(), name: Date.now() + ' NAME' };
const repository = new (class extends Repositories.CollectionRepository {
  searchableColumns() {
    return [];
  }
  resolveItems() {
    return [new Fluent(Object.assign({}, targetData))];
  }
})();

class Update extends Resource {
  repository() {
    return repository;
  }

  fields() {
    return [new Fields.ID(), new Fields.Text('name')];
  }
}

const resource = new Update();
const app = express();

app.use(bodyParser.json());

beforeAll(() => {
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  app.use('/api', Avon.routes(express.Router()));
});

describe('PUT resources api', () => {
  test('Could respond 404 for invalid resources', () => {
    return request(app)
      .put(`/api/resources/anything/anything`)
      .expect('Content-Type', /json/)
      .expect(404)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(404);
        expect(message).toBe('Resource not found');
        expect(name).toBe('NotFound');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('Resource not found');
      });
  });

  test('Could update requested resource by given payload', () => {
    const name = Date.now() + ' ANOTHER NAME';
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/${targetData.id}`)
      .send({ name })
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data } }) => {
        expect(code).toBe(200);
        expect(data.fields).toEqual((await repository.all())[0].all());
        expect(data.authorization).toEqual({
          authorizedToUpdate: true,
          authorizedToDelete: true,
        });
        expect(data.fields.name).toBe(name);
        expect(data.fields.name).not.toBe(targetData.name);
      });
  });
});
