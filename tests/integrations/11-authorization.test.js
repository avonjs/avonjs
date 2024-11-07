//@ts-check
const express = require('express');
const request = require('supertest');
const bodyParser = require('body-parser');

const { Repositories, Resource, Fields, SoftDeletes } = require('../../dist');

class Other extends Resource {
  repository() {
    return new (class extends Repositories.Collection {
      resolveItems() {
        return [];
      }
      searchableColumns() {
        return [];
      }
    })();
  }
  fields() {
    return [new Fields.ID(), new Fields.BelongsTo('posts')];
  }

  async authorizedToAdd(request, model) {
    return model.getKey() > 1;
  }
}

class Post extends Resource {
  repository() {
    return new (class extends SoftDeletes(Repositories.Collection) {
      resolveItems() {
        return [
          { id: 1 },
          { id: 2 },
          { id: 3 },
          { id: 4 },
          { id: 5, deleted_at: new Date().toISOString() },
          { id: 6, deleted_at: new Date().toISOString() },
        ];
      }
      searchableColumns() {
        return [];
      }
    })();
  }

  fields() {
    return [new Fields.ID()];
  }

  softDeletes() {
    return true;
  }

  authorizable() {
    return true;
  }
  async authorizedToViewAny() {
    return false;
  }
  async authorizedToView() {
    return this.resource.getKey() === 2;
  }
  async authorizedToCreate(request) {
    return false;
  }
  async authorizedToUpdate() {
    return this.resource.getKey() === 2;
  }
  async authorizedToDelete() {
    return this.resource.getKey() === 3;
  }
  async authorizedToForceDelete() {
    return this.resource.getKey() === 4;
  }
  async authorizedToRestore() {
    return this.resource.getKey() === 5;
  }
  async authorizedToReview() {
    return this.resource.getKey() === 6;
  }
  async authorizedToAdd(request, related) {
    return related.id === 2;
  }
}

const resource = new Post();
const app = express();

app.use(bodyParser.json());

beforeAll(() => {
  const { Avon } = require('../../dist');
  // configure Avon
  Avon.resources([resource, new Other()]);

  app.use('/api', Avon.express());
  app.use('/unauthenticated/api', Avon.routes(express.Router(), true));
});

describe('Unauthenticated requests', () => {
  test('Could restrict get unauthenticated api', () => {
    return request(app)
      .get(`/unauthenticated/api`)
      .expect(401)
      .then(({ body: { code, name } }) => {
        expect(code).toBe(401);
        expect(name).toBe('Unauthenticated');
      });
  });

  test('Could restrict post unauthenticated api', () => {
    return request(app)
      .post(`/unauthenticated/api`)
      .expect(401)
      .then(({ body: { code, name } }) => {
        expect(code).toBe(401);
        expect(name).toBe('Unauthenticated');
      });
  });
});

describe('Unauthorized resources api', () => {
  test('Could not "viewAny" unauthorized resources', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}`)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "store" unauthorized resources', () => {
    return request(app)
      .post(`/api/resources/${resource.uriKey()}`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "view" unauthorized resources by id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "review" unauthorized resources by id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "update" unauthorized resources by id', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "delete" unauthorized resources by id', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "forceDelete" unauthorized resources by id', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "restore" unauthorized resources by id', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });

  test('Could not "add" unauthorized resources by id', () => {
    return request(app)
      .post(`/api/resources/${new Other().uriKey()}`)
      .expect('Content-Type', /json/)
      .send({ post: 1 })
      .expect(403)
      .then(({ body: { code, message, name, meta } }) => {
        expect(code).toBe(403);
        expect(message).toBe('This action is unauthorized.');
        expect(name).toBe('Forbidden');
        expect(meta.stack).not.toBeUndefined();
        expect(meta.stack.message).toBe('This action is unauthorized.');
      });
  });
});

describe('Could authorize per resource', () => {
  test('Could "view" authorized resources by id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/2`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { code, data } }) => {
        expect(code).toBe(200);
        expect(data.fields.id).toEqual(2);
        expect(data.authorization).toEqual({
          authorizedToUpdate: true,
          authorizedToDelete: false,
          authorizedToForceDelete: false,
        });
      });
  });

  test('Could "review" authorized resources by id', () => {
    return request(app)
      .get(`/api/resources/${resource.uriKey()}/6/review`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { code, data } }) => {
        expect(code).toBe(200);
        expect(data.fields.id).toEqual(6);
        expect(data.authorization).toEqual({
          authorizedToForceDelete: false,
          authorizedToRestore: false,
        });
      });
  });

  test('Could "update" authorized resources by id', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/2`)
      .expect('Content-Type', /json/)
      .expect(200);
  });

  test('Could "delete" authorized resources by id', () => {
    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/3`)
      .expect(204);
  });

  test('Could "forceDelete" authorized resources by id', () => {
    return request(app)
      .delete(`/api/resources/${resource.uriKey()}/4/force`)
      .expect(204);
  });

  test('Could "restore" authorized resources by id', () => {
    return request(app)
      .put(`/api/resources/${resource.uriKey()}/5/restore`)
      .expect(204);
  });

  test('Could "add" authorized resources by id', () => {
    return request(app)
      .post(`/api/resources/${new Other().uriKey()}`)
      .expect('Content-Type', /json/)
      .send({ post: 2 })
      .expect(201);
  });
});
