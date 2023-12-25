//@ts-check
const express = require('express');
const request = require('supertest');
const { Repositories, Resource, Fields } = require('../../dist');

class Index extends Resource {
  repository() {
    return new (class extends Repositories.Collection {
      searchableColumns() {
        return [];
      }
      resolveItems() {
        return [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5 },
          { id: 6 },
          { id: 7 },
          { id: 8 },
          { id: 9 },
          { id: 10 },
          { id: 11 },
        ];
      }
    })();
  }

  fields() {
    return [new Fields.ID()];
  }

  perPageOptions() {
    return [5, 10, 15, 50];
  }
}

const resource = new Index();
const app = express();

beforeAll(() => {
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  app.use('/api', Avon.routes(express.Router()));
});

describe('GET resources api', () => {
  test('response', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data.length).toBe(resource.perPageOptions()[0]);
        expect(meta.count).toBe((await resource.repository().all()).length);
        expect(meta.currentPage).toBe(1);
        expect(meta.perPage).toBe(resource.perPageOptions()[0]);
        expect(meta.perPageOptions).toEqual(resource.perPageOptions());
      });
  });

  test('custom page', () => {
    const page = 3;
    return request(app)
      .get(`/api/resources/${resource.uriKey()}?page=${page}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data, meta } }) => {
        const resources = await resource.repository().all();
        const count = resources.length;
        const nextPageResources = resources.splice(
          resource.perPageOptions()[0] * (page - 1),
          resource.perPageOptions()[0] * page,
        );
        expect(code).toBe(200);
        expect(data.length).toBe(nextPageResources.length);
        expect(meta.count).toBe(count);
        expect(meta.currentPage).toBe(page);
        expect(meta.perPage).toBe(resource.perPageOptions()[0]);
        expect(meta.perPageOptions).toEqual(resource.perPageOptions());
      });
  });

  test('custom perPage', () => {
    return request(app)
      .get(
        `/api/resources/${resource.uriKey()}?perPage=${
          resource.perPageOptions()[1]
        }`,
      )
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data.length).toBe(resource.perPageOptions()[1]);
        expect(meta.count).toBe((await resource.repository().all()).length);
        expect(meta.currentPage).toBe(1);
        expect(meta.perPage).toBe(resource.perPageOptions()[1]);
        expect(meta.perPageOptions).toEqual(resource.perPageOptions());
      });
  });

  test('data', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { data } }) => {
        const resources = await resource.repository().all();
        data.forEach((item, index) => {
          expect(item).toHaveProperty('authorization');
          expect(item).toHaveProperty('fields');
          expect(item.fields).toEqual(resources[index].all());
          expect(item.authorization).toEqual({
            authorizedToView: true,
            authorizedToUpdate: true,
            authorizedToDelete: true,
          });
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
});
