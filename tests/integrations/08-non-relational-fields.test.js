//@ts-check
const express = require('express');
const request = require('supertest');
const fs = require('fs');
const bodyParser = require('body-parser');

const { Repositories, Resource, Fields } = require('../../dist');
const { join } = require('path');

const { Avon } = require('../../dist');
const posts = join(__dirname, 'posts.json');
const testPosts = [
  {
    comments: [
      {
        id: 1,
        comment: 'Comment 1',
      },
    ],
    active: false,
    author: 'zarehesmaiel@gmail.com',
    id: 1,
    meta: {
      title: 'META: post 1',
    },
    name: 'Post 1',
  },
];
const updatePost = {
  comments: [
    {
      id: 2,
      comment: 'Comment updated',
    },
  ],
  active: true,
  author: 'updated.zarehesmaiel@gmail.com',
  meta: {
    title: 'META: post 1 updated',
  },
  name: 'Post 1 updated',
};

class Repository extends Repositories.File {
  filepath() {
    return posts;
  }
  searchableColumns() {
    return [];
  }
}

class Post extends Resource {
  fields() {
    return [
      new Fields.Array('comments').items({
        type: 'object',
        properties: { id: { type: 'integer' }, comment: { type: 'integer' } },
      }),
      new Fields.Binary('active'),
      new Fields.Email('author'),
      new Fields.ID(),
      new Fields.Json('meta', [new Fields.Text('title')]),
      new Fields.Text('name'),
    ];
  }
  repository() {
    return new Repository();
  }
}

const app = express();
app.use(bodyParser.json());

beforeAll(() => {
  fs.writeFileSync(posts, JSON.stringify(testPosts));

  // configure Avon
  Avon.resources([new Post()]);

  app.use('/api', Avon.routes(express.Router()));
});

// create storage
afterAll(() => fs.unlinkSync(posts));

describe('The non-relational resource fields', () => {
  test('Could retrieve data from resources by fields', () => {
    return request(app)
      .get(`/api/resources/${new Post().uriKey()}/1`)
      .expect('Content-Type', /json/)
      .expect(200)
      .then(({ body: { code, data } }) => {
        expect(code).toBe(200);
        expect(data.fields).toEqual(testPosts[0]);
        expect(data.authorization).toEqual({
          authorizedToUpdate: true,
          authorizedToDelete: true,
        });
      });
  });

  test('Could store resource payload', () => {
    return request(app)
      .post(`/api/resources/${new Post().uriKey()}`)
      .expect('Content-Type', /json/)
      .send({ ...testPosts[0], id: undefined })
      .expect(201)
      .then(async ({ body: { code, data } }) => {
        const post = Object.assign({}, testPosts[0], { id: data.fields.id });

        expect(code).toBe(201);
        expect(data.fields).toEqual(post);
        expect((await new Repository().find(data.fields.id))?.all()).toEqual({
          ...post,
          meta: JSON.stringify(post.meta),
        });
      });
  });

  test('Could update resource payload', () => {
    return request(app)
      .put(`/api/resources/${new Post().uriKey()}/${testPosts[0].id}`)
      .expect('Content-Type', /json/)
      .send(updatePost)
      .expect(200)
      .then(async ({ body: { code, data } }) => {
        updatePost.id = testPosts[0].id;
        expect(code).toBe(200);
        expect(data.fields).toEqual(updatePost);
        expect((await new Repository().find(testPosts[0].id))?.all()).toEqual({
          ...updatePost,
          meta: JSON.stringify(updatePost.meta),
        });
      });
  });
});
