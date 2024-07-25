//@ts-check
const express = require('express');
const request = require('supertest');
const fs = require('fs');

const { Repositories, Resource, Fields, SoftDeletes } = require('../../dist');
const { join } = require('path');

const parents = join(__dirname, 'parents.json');
const associations = join(__dirname, 'associations.json');

class Parent extends Resource {
  repository() {
    return new (class extends SoftDeletes(Repositories.File) {
      filepath() {
        return parents;
      }
      searchableColumns() {
        return [];
      }
    })();
  }

  fields() {
    return [new Fields.ID(), new Fields.HasMany('associations')];
  }

  softDeletes() {
    return true;
  }
}

class Association extends Resource {
  repository() {
    return new (class extends SoftDeletes(Repositories.File) {
      filepath() {
        return associations;
      }
      searchableColumns() {
        return [];
      }
    })();
  }

  fields() {
    return [new Fields.ID(), new Fields.BelongsTo('parents')];
  }

  softDeletes() {
    return true;
  }
}

let parentResource = undefined;
let childResource = undefined;
const app = express();

beforeAll(() => {
  fs.writeFileSync(parents, JSON.stringify([{ id: 1 }]));
  fs.writeFileSync(
    associations,
    JSON.stringify([
      { id: 1, parent_id: 1, deleted_at: null },
      { id: 2, parent_id: 1, deleted_at: new Date().toISOString() },
    ]),
  );

  parentResource = new Parent();
  childResource = new Association();
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([parentResource, childResource]);

  app.use('/api', Avon.routes(express.Router()));
});
// create storage
afterAll(() => {
  fs.unlinkSync(parents);
  fs.unlinkSync(associations);
});

describe('Associable resources api', () => {
  test('Could retrieve associated resources for given resource id', () => {
    return request(app)
      .get(`/api/resources/${parentResource.uriKey()}/associable/associations`)
      .expect(200)
      .then(({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data).toEqual([
          {
            metadata: { softDeletes: true, softDeleted: false },
            authorization: {
              authorizedToView: true,
              authorizedToUpdate: true,
              authorizedToDelete: true,
              authorizedToForceDelete: true,
              authorizedToRestore: true,
              authorizedToReview: true,
            },
            fields: { id: 1 },
          },
        ]);
        expect(meta).toStrictEqual({
          count: 1,
          currentPage: 1,
          perPage: 10,
          perPageOptions: [10],
        });
      });
  });
  test('Could retrieve associated resources for given resource id', () => {
    return request(app)
      .get(
        `/api/resources/${parentResource.uriKey()}/associable/associations?withTrashed=true`,
      )
      .expect(200)
      .then(({ body: { code, data, meta } }) => {
        expect(code).toBe(200);
        expect(data).toEqual([
          {
            metadata: { softDeletes: true, softDeleted: false },
            authorization: {
              authorizedToView: true,
              authorizedToUpdate: true,
              authorizedToDelete: true,
              authorizedToForceDelete: true,
              authorizedToRestore: true,
              authorizedToReview: true,
            },
            fields: { id: 1 },
          },
          {
            metadata: { softDeletes: true, softDeleted: true },
            authorization: {
              authorizedToView: true,
              authorizedToUpdate: true,
              authorizedToDelete: true,
              authorizedToForceDelete: true,
              authorizedToRestore: true,
              authorizedToReview: true,
            },
            fields: { id: 2 },
          },
        ]);
        expect(meta).toStrictEqual({
          count: 2,
          currentPage: 1,
          perPage: 10,
          perPageOptions: [10],
        });
      });
  });
});
