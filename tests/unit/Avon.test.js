//@ts-check
const { version } = require('../../package.json');

const Empty = require('../Fixtures/resources/Empty');

test('Version is correct!', () => {
  const { Avon } = require('../../dist');
  expect(version).toBe(Avon.version());
});

test('Find resource by key', () => {
  const { Avon } = require('../../dist');
  const post = new Empty();
  Avon.resources([post]);

  expect(Avon.resourceForKey(post.uriKey())).not.toBe(undefined);
  expect(Avon.resourceForKey(post.uriKey()) instanceof Empty).toBe(true);
});

test('Could register resources from directory', () => {
  const { Avon } = require('../../dist');
  const post = new Empty();

  Avon.resourceIn(RESOURCES);

  expect(Avon.resourceForKey(post.uriKey())).not.toBe(undefined);
  expect(Avon.resourceForKey(post.uriKey()) instanceof Empty).toBe(true);
});
