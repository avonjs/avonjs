//@ts-check
const express = require('express');
const request = require('supertest');
const fs = require('fs');

const { Repositories, Resource, Fields, SoftDeletes } = require('../../dist');
const { join } = require('path');
const { TrashedStatus } = require('../../dist/contracts');

const filepath = join(__dirname, 'deletes.json');

class Delete extends Resource {
  repository() {
    return new (class extends SoftDeletes(Repositories.File) {
      filepath() {
        return filepath;
      }
      searchableColumns() {
        return [];
      }
    })();
  }

  fields() {
    return [new Fields.ID(), new Fields.Text('deleted_at')];
  }

  softDeletes() {
    return true;
  }
}

let resource = undefined;
const app = express();
const items = [
  { id: 1, deleted_at: null },
  { id: 2, deleted_at: '2023-12-01T08:23:23.535Z' },
  { id: 3, deleted_at: '2023-12-01T08:23:23.535Z' },
];

beforeAll(() => {
  fs.writeFileSync(filepath, JSON.stringify(items));

  resource = new Delete();
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource]);

  app.use('/api', Avon.routes(express.Router()));
});
// create storage
afterAll(() => fs.unlinkSync(filepath));

describe('soft delete resources api', () => {
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

  test('Could remove deleted resources', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data.length).toBe(1);
        expect(meta.count).toBe(1);
        expect(meta.currentPage).toBe(1);
        expect(meta.perPage).toBe(resource.perPageOptions()[0]);
        expect(meta.perPageOptions).toEqual(resource.perPageOptions());
      });
  });

  test('Could show all resources', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}?trashed=${TrashedStatus.WITH}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data.length).toBe(3);
        expect(meta.count).toBe(3);
        expect(meta.currentPage).toBe(1);
        expect(meta.perPage).toBe(resource.perPageOptions()[0]);
        expect(meta.perPageOptions).toEqual(resource.perPageOptions());
      });
  });

  test('Could retrieve deleted resources', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}?trashed=${TrashedStatus.ONLY}`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(async ({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data.length).toBe(2);
        expect(meta.count).toBe(2);
        expect(meta.currentPage).toBe(1);
        expect(meta.perPage).toBe(resource.perPageOptions()[0]);
        expect(meta.perPageOptions).toEqual(resource.perPageOptions());
      });
  });

  test('Could review deleted resource for given id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/${items[1].id}/review`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { code, data } }) => {
        expect(code).toBe(200);
        expect(data.fields).toEqual(items[1]);
        expect(data.authorization).toEqual({
          authorizedToForceDelete: true,
          authorizedToRestore: true,
        });
      });
  });

  test('Could soft delete resource for given id', () => {
    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/1`)
      .expect(204)
      .then(async () => {
        const trashed = await resource.repository().withTrashed().find(1);

        expect(await resource.repository().find(1)).toBeUndefined();
        expect(trashed).not.toBeUndefined();
        expect(trashed?.id).toEqual(1);
      });
  });

  test('Could force delete resource for given id', async () => {
    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/2/force`)
      .expect(204)
      .then(async () => {
        expect(await resource.repository().find(2)).toBeUndefined();
        expect(
          await resource.repository().withTrashed().find(2),
        ).toBeUndefined();
      });
  });

  test('Could restore deleted resource for given id', async () => {
    expect(await resource.repository().find(3)).toBeUndefined();
    expect(
      await resource.repository().withTrashed().find(3),
    ).not.toBeUndefined();

    return request(app)
      .put(`/api/resources/${resource.uriKey()}/3/restore`)
      .expect(204)
      .then(async () => {
        expect(await resource.repository().find(3)).not.toBeUndefined();
      });
  });
});
