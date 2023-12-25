//@ts-check
const express = require('express');
const request = require('supertest');

const { Repositories, Resource, Fields } = require('../../dist');

class Delete extends Resource {
  repository() {
    return new (class extends Repositories.Collection {
      searchableColumns() {
        return [];
      }
      resolveItems() {
        return [{ id: 1 }];
      }
    })();
  }

  fields() {
    return [new Fields.ID()];
  }
}

const resource = new Delete();
const app = express();

beforeAll(() => {
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  app.use('/api', Avon.routes(express.Router()));
});

describe('DELETE resources api', () => {
  test('Could respond 404 for invalid resources', () => {
    return request(app)
      .delete(`/api/resources/anything/anything`)
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

  test('Could delete requested resource for given id', () => {
    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/1`)
      .expect(204);
  });
});
