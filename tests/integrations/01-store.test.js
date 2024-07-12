//@ts-check
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const { Repositories, Resource, Fields } = require('../../dist');
const items = [];
const repository = new (class extends Repositories.Collection {
  searchableColumns() {
    return [];
  }
  resolveItems() {
    return items;
  }
})();

class Store extends Resource {
  repository() {
    return repository;
  }

  fields() {
    return [new Fields.ID(), new Fields.Text('name')];
  }
}

const resource = new Store();
const app = express();

app.use(bodyParser.json());

beforeAll(() => {
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  app.use('/api', Avon.routes(express.Router()));
});

describe('POST resources api', () => {
  test('Could respond 404 for invalid resources', () => {
    return request(app)
      .post(`/api/resources/anything`)
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

  test('Could store requested payload', () => {
    const name = 'john';
    return request(app)
      .post(`/api/resources/${resource.uriKey()}`)
      .send({ name })
      .expect('Content-Type', /json/)
      .expect(201)
      .then(async ({ body: { code, data } }) => {
        expect(code).toBe(201);
        const resource = await repository.find(data.fields.id);

        expect(resource?.getAttribute('name')).toEqual(name);
        expect(data.authorization).toEqual({
          authorizedToUpdate: true,
          authorizedToDelete: true,
        });
      });
  });
});
