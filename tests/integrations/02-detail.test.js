//@ts-check
const express = require('express');
const request = require('supertest');
const { Repositories, Resource, Fields } = require('../../dist');
const items = [
  { id: 1, name: 'Detail First' },
  { id: 2, name: 'Detail Second' },
];
class Detail extends Resource {
  repository() {
    return new (class extends Repositories.Collection {
      searchableColumns() {
        return [];
      }
      resolveItems() {
        return items;
      }
    })();
  }

  fields() {
    return [new Fields.ID(), new Fields.Text('name')];
  }
}

const resource = new Detail();
const app = express();

beforeAll(() => {
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  app.use('/api', Avon.routes(express.Router()));
});

describe('GET single resources api', () => {
  test('Could find exists by id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/${items[0].id}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { code, data } }) => {
        expect(code).toBe(200);
        expect(data.fields).toEqual(items[0]);
        expect(data.authorization).toEqual({
          authorizedToUpdate: true,
          authorizedToDelete: true,
        });
      });
  });

  test('Could respond 404 for invalid resources', () => {
    return request(app)
      .get(`/api/resources/anything`)
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

  test('Could respond 404 for invalid resource id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/anything`)
      .expect('Content-Type', /json/)
      .expect(404)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(404);
        expect(message).toBe('Model not found');
        expect(name).toBe('NotFound');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('Model not found');
      });
  });
});
