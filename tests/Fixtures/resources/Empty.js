const { Repositories, Resource, Fields } = require('../../../dist');

class Empty extends Resource {
  repository() {
    return new (class extends Repositories.Collection {
      searchableColumns() {
        return [];
      }
      resolveItems() {
        return [];
      }
    })();
  }

  fields() {
    return [new Fields.ID(), new Fields.Text('name')];
  }
}

module.exports = Empty;
