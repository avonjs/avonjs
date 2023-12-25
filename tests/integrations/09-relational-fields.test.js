//@ts-check
const express = require('express');
const request = require('supertest');
const fs = require('fs');
const bodyParser = require('body-parser');

const { Repositories, Resource, Fields } = require('../../dist');
const { join } = require('path');

const { Avon } = require('../../dist');
const categories = join(__dirname, 'categories.json');
const pivots = join(__dirname, 'pivots.json');
const posts = join(__dirname, 'posts.json');
const comments = join(__dirname, 'comments.json');
const profiles = join(__dirname, 'profiles.json');
const users = join(__dirname, 'users.json');

class CategoryRepository extends Repositories.File {
  filepath() {
    return categories;
  }
  searchableColumns() {
    return [];
  }
}
class PivotRepository extends Repositories.File {
  filepath() {
    return pivots;
  }
  searchableColumns() {
    return [];
  }
}

class PostRepository extends Repositories.File {
  filepath() {
    return posts;
  }
  searchableColumns() {
    return [];
  }
}

class CommentRepository extends Repositories.File {
  filepath() {
    return comments;
  }
  searchableColumns() {
    return [];
  }
}

class ProfileRepository extends Repositories.File {
  filepath() {
    return profiles;
  }
  searchableColumns() {
    return [];
  }
}

class UserRepository extends Repositories.File {
  filepath() {
    return users;
  }
  searchableColumns() {
    return [];
  }
}

class Category extends Resource {
  fields() {
    return [
      new Fields.ID(),
      new Fields.Text('name'),
      new Fields.BelongsToMany('posts', 'pivots')
        .pivots(() => [new Fields.Integer('order')])
        .load(),
    ];
  }
  repository() {
    return new CategoryRepository();
  }
}
class Post extends Resource {
  fields() {
    return [
      new Fields.ID(),
      new Fields.BelongsTo('users'),
      new Fields.HasMany('comments'),
      new Fields.BelongsToMany('categories', 'pivots').nullable(),
    ];
  }
  repository() {
    return new PostRepository();
  }
}
class Pivot extends Resource {
  fields() {
    return [
      new Fields.ID(),
      new Fields.Integer('order').default(() => Date.now()),
      new Fields.BelongsTo('categories'),
      new Fields.HasMany('posts'),
    ];
  }
  repository() {
    return new PivotRepository();
  }
}

class Comment extends Resource {
  fields() {
    return [
      new Fields.ID(),
      new Fields.BelongsTo('posts').load(),
      new Fields.BelongsTo('users').load(),
    ];
  }
  repository() {
    return new CommentRepository();
  }
}

class Profile extends Resource {
  fields() {
    return [new Fields.ID(), new Fields.BelongsTo('users')];
  }
  repository() {
    return new ProfileRepository();
  }
}

class User extends Resource {
  fields() {
    return [
      new Fields.ID(),
      new Fields.HasOne('profiles').load(),
      new Fields.HasMany('posts').load(),
      new Fields.HasMany('comments').load(),
    ];
  }
  repository() {
    return new UserRepository();
  }
}

const app = express();
app.use(bodyParser.json());

beforeAll(() => {
  fs.writeFileSync(categories, JSON.stringify([{ id: 1, name: 'Post 1' }]));
  fs.writeFileSync(
    pivots,
    JSON.stringify([{ id: 1, category_id: 1, post_id: 1, order: 1 }]),
  );
  fs.writeFileSync(
    posts,
    JSON.stringify([
      { id: 1, user_id: 1, name: 'Post 1' },
      { id: 2, user_id: 2, name: 'Post 2' },
      { id: 3, user_id: 1, name: 'Post 3' },
    ]),
  );
  fs.writeFileSync(
    comments,
    JSON.stringify([
      { id: 1, post_id: 1, comment: 'Comment 1', user_id: 1 },
      { id: 1, post_id: 2, comment: 'Comment 2', user_id: 2 },
    ]),
  );
  fs.writeFileSync(
    profiles,
    JSON.stringify([{ id: 1, user_id: 1, name: 'User 1' }]),
  );
  fs.writeFileSync(
    users,
    JSON.stringify([
      { id: 1, name: 'User 1' },
      { id: 2, name: 'User 2' },
    ]),
  );

  // configure Avon
  Avon.resources([
    new Category(),
    new Pivot(),
    new Post(),
    new Comment(),
    new Profile(),
    new User(),
  ]);

  app.use('/api', Avon.routes(express.Router()));
});

// create storage
afterAll(() => {
  try {
    fs.unlinkSync(categories);
    fs.unlinkSync(pivots);
    fs.unlinkSync(posts);
    fs.unlinkSync(comments);
    fs.unlinkSync(profiles);
    fs.unlinkSync(users);
  } catch (error) {}
});

describe('The relational resource fields', () => {
  describe('BelongsTo field', () => {
    test('Could retrieve data from resources by unloaded relations', () => {
      return request(app)
        .get(`/api/resources/${new Post().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.user).toEqual(1);
        });
    });

    test('Could retrieve data from resources by loaded relations', () => {
      return request(app)
        .get(`/api/resources/${new Comment().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.user).toEqual({ id: 1 });
        });
    });

    test('Could store related resource', () => {
      return request(app)
        .post(`/api/resources/${new Post().uriKey()}`)
        .expect('Content-Type', /json/)
        .send({ user: 2, categories: [] })
        .expect(201)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(201);
          expect(data.fields.user).toBe(2);
        });
    });

    test('Could update related resource', () => {
      return request(app)
        .put(`/api/resources/${new Post().uriKey()}/3`)
        .expect('Content-Type', /json/)
        .send({ user: 2, categories: [] })
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.user).toBe(2);
        });
    });
  });

  describe('HasOne field', () => {
    test('Could retrieve data from resources by unloaded relations', () => {
      return request(app)
        .get(`/api/resources/${new Profile().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.user).toEqual(1);
        });
    });

    test('Could retrieve data from resources by loaded relations', () => {
      return request(app)
        .get(`/api/resources/${new User().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.profile).toEqual({ id: 1 });
        });
    });
  });

  describe('HasMany field', () => {
    test('Could retrieve data from resources by loaded relations', () => {
      return request(app)
        .get(`/api/resources/${new Post().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.comments).toEqual([{ id: 1 }]);
        });
    });
  });

  describe('BelongsToMany field', () => {
    test('Could retrieve data from resources by unloaded relations', () => {
      return request(app)
        .get(`/api/resources/${new Post().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.posts).toBeUndefined();
        });
    });

    test('Could retrieve data from resources by loaded relations', () => {
      return request(app)
        .get(`/api/resources/${new Category().uriKey()}/1`)
        .expect('Content-Type', /json/)
        .expect(200)
        .then(({ body: { code, data } }) => {
          expect(code).toBe(200);
          expect(data.fields.posts).toEqual([{ id: 1, order: 1 }]);
        });
    });

    test('Could attach related resource', () => {
      return request(app)
        .post(`/api/resources/${new Category().uriKey()}`)
        .expect('Content-Type', /json/)
        .send({ posts: [{ id: 1, order: 10 }] })
        .expect(201)
        .then(async ({ body: { code, data } }) => {
          expect(code).toBe(201);
          expect(data.fields.posts).toEqual([{ id: 1, order: 10 }]);
        });
    });
  });
});
