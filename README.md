**Installation**

- [Requirements](#requirements)
- [Installation](#installation)
- [Initialize](#initialize)
- [Authentication](#authentication)
  - [Login](#login)
  - [Credentials](#credentials)
  - [Options](#options)
  - [Excluding](#excluding)
- [Commands](#commands)

**Resources**

- [The basics](#introduction)
  - [Defining Resources](#defining-resources)
  - [Registering Resources](#registering-resources)
  - [Configuring Swagger UI](#configuring-swagger-ui)
  - [Resource Hooks](#resource-hooks)
- [Fields](#defining-fields)
  - [Showing / Hiding Fields](#showing--hiding-fields)
  - [Dynamic Field Methods](#dynamic-field-methods)
  - [Default Values](#default-values)
  - [Field Hydration](#field-hydration)
  - [Field Types](#field-types)
  - [Customization](#customization)
  - [Nullable Fields](#nullable-fields)
  - [Optional Fields](#optional-fields)
  - [Filterable Fields](#filterable-fields)
  - [Orderable Fields](#orderable-fields)
  - [Lazy Fields](#lazy-fields)
- [Relationships](#relationships)
  - [BelongsTo](#belongsto)
  - [HasMany](#hasmany)
  - [HasOne](#hasone)
  - [BelongsToMany](#belongstomany)
  - [Customization](#customization)
- [Validation](#validation)
  - [Rules](#attaching-rules)
  - [Creation Rules](#creation-rules)
  - [Update Rules](#update-rules)
- [Authorization](#authorization)

**Repositories**

- [Defining Repositories](#defining-repositories)
- [Preset Repositories](#preset-repositories)
- [Defining Models](#defining-models)
- [Soft Deletes](#soft-deletes)
- [Timestamps](#timestamps)

**Filters**

- [Defining Filters](#defining-filters)
- [Registering Filters](#registering-filters)
- [Authorization Filters](#authorization-filters)

**Orderings**

- [Defining Orderings](#defining-orderings)
- [Registering Orderings](#registering-orderings)
- [Authorization Orderings](#authorization-orderings)

**Actions**

- [Defining Actions](#defining-actions)
- [Action Fields](#action-fields)
- [Action Responses](#action-responses)
- [Registering Actions](#registering-actions)
- [Authorization Actions](#authorization-actions)
- [Standalone Actions](#standalone-actions)

**Activity Log**

- [Action Events](#action-events)
- [Custom Action Event](#custom-action-event)
- [Action Event Table](#action-event-table)
- [Action Event Actor](#action-event-actor)

**Error Handling**

- [Register Error Handler](#register-error-handler)

# Installation

## Requirements

Avon has a few requirements you should be aware of before installing:

- Node.js (Version 18)
- Expressjs Framework (Version 4.X)

## Installation

The following command install Avon application:

via npm:

    npm install @avonjs/avonjs

via yarn:

    yarn install @avonjs/avonjs

To develop fat in Avon you have to install the Avon [CLI](https://www.npmjs.com/package/@avonjs/cli):

via npm:

    npm install @avonjs/cli -g

via yarn:

    yarn install @avonjs/cli -g

## Initialize

At first point you have to register the router:

```
// index.js

import { Avon } from '@avonjs/avonjs';
import express from 'express';
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
// required middlewares
app.use(bodyParser.json()).use(cors());

// register Avon router without authentication
app.use('/api', Avon.routes(express.Router()));

// or register Avon router with authentication
app.use('/api', Avon.routes(express.Router(), true));

app.listen(3000, () => {
  console.log('running')
})
```

## Authentication

Avon ships by JWT authentication approach but it's disabled by default. to enable authentication you have to pass the `true` value as a second argument of the "routes" method:

```
// register Avon router
app.use('/api', Avon.routes(express.Router(), true));
```

By default, Avon using the [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken) package to generate JWT tokens.

### Login

After enabling the JWT authentication you users need to login to get JWT token and access to API's. for this Avon has the `attemptUsing` method to handle users login:

```
Avon.attemptUsing(async (payload) => {
  const user = await new Users().first([
    {
      key: 'email',
      operator: Constants.Operator.eq,
      value: payload.email,
    },
  ]);

  if (user) {
    return { id: user.getKey() };
  }
});
```

you could return an arbitrary object containing the user identifier key as an `id` attribute.

### Credentials

Also, you are free to customize login credentials by the `credentials` method in the Avon class like so:

```
Avon.credentials([new Fields.Email().default(() => 'zarehesmaiel@gmail.com')]);
```

The `credentials` method accepts an array of Avon fields as a parameter.

### Options

Avon `signOptions` method allows you to customize JWT token generation config. the following expires JWT after '30 second':

```
Avon.signOptions({ expiresIn: '30s' });
```

Alos to changing the JWT secret key the `appKey` could help you:

```
Avon.appKey('AvonSecret')
```

### Excluding

If you need to exclude some routes from authentication the `except` method could help you:

```
Avon.except('/api/resources/pages').except(/.*\/actions\/register-users/)
```

You are free to use `string` or `regex` to exclude paths. we are using the [express-unless](https://www.npmjs.com/package/express-unless) to handling this situation.

## Commands

By default, Avon put files generated by Avon cli under `src` directory. to change this path you could configure it by root `package.json` file:

```
{
    ...
    "sourceDir" : "myDir"
}
```

Also, Avon detects the type of package by checking the `tsconfig.json` existence or module type indicated on the package json but you could determine the output file per command:

```
avonjs make:resource Another --output typescript
```

# Resources

## Introduction

Avon is a beautiful API generator for Node.js applications written in typescript. Of course, the primary feature of Avon is the ability to administer your underlying repository records. Avon accomplishes this by allowing you to define an Avon `resource` corresponding to each `repository` in your application.

## Defining Resources

By default, Avon resources are stored in the `src/avonjs` directory of your application. You may generate a new resource using the `resource:make` Avon command:

```
avonjs make:resource Post
```

Freshly created Avon resources only contain an `ID` field definition and simple repository instance. Don't worry, we'll add more [fields](#fields) to our resource soon and you'll learn more about [repositories](#defining-repositories) later.

## Registering Resources

Before resources are available within your API, they must first be registered with Avon. You may use the `resources` method to manually register individual resources:

```
// resources method
Avon.resources([
    New Post(),
])
```

If you do not want a some resource api to appear in the swagger-ui, you may override the following property of your resource class:

- `availableForIndex`
- `availableForDetail`
- `availableForCreation`
- `availableForUpdate`
- `availableForDelete`
- `availableForForceDelete`
- `availableForRestore`
- `availableForReview`

## Configuring Swagger UI

Avon creates a schema based on the [OpenApi](https://github.com/OAI/OpenAPI-Specification) that enables you to use the [swagger-ui](https://github.com/swagger-api/swagger-ui/blob/master/docs/usage/installation.md) for documentation. here we using docker to install `swagger-ui`. let's do it:

first run the following command to install swagger-ui:

```
docker pull swaggerapi/swagger-ui
```

now we use the previously [created](#initialize) URL for schema to run docker:

```
docker run -p 80:8080 -e SWAGGER_JSON_URL=http://localhost:3000/api/schema -e PERSIST_AUTHORIZATION=true swaggerapi/swagger-ui
```

now you can go to the `http://localhost` and see the result.

**_Attentions_**

- You have to run the server to see the the documentation in the swagger. maybe you need something like this in the root of your project `npm run start`
- If you see `CORS` error when swagger ui loaded the [this](https://expressjs.com/en/resources/middleware/cors.html#installation) tutorial can solve your problem.

## Resource Hooks

Avon provides a set of hooks that you can define on a resource. These hooks are invoked when the corresponding resource action is executed within Avon, allowing you to execute custom logic at specific points in the lifecycle of a resource.

- `afterCreate`
- `beforeCreate`
- `afterUpdate`
- `beforeUpdate`
- `afterDelete`
- `beforeDelete`
- `afterRestore`
- `beforeRestore`
- `afterForceDelete`
- `beforeForceDelete`

### Post-Commit Hooks

In addition to the above hooks, Avon provides the following hooks that are called after the resource changes are committed to the storage:

- `created`
- `updated`
- `deleted`
- `restored`

## Pagination

If you would like to customize the selectable maximum result amounts shown on each resource's "per page" filter menu, you can do so by overriding the `perPageOptions` method:

```
/**
* Get the pagination per-page values
*/
public perPageOptions(): number[] {
    return [15, 25, 50];
}
```

## Defining Fields

Each Avon resource contains a fields method. This method returns an array of fields, which generally extend the `Fields\Field` class. Avon ships with a variety of fields out of the box, including fields for text inputs, booleans, etc.

To add a field to a resource, you may simply add it to the resource's fields method. Typically, fields have to add as new class with accepts several arguments; however, you usually only need to pass the "attribute" name of the field that normally determine the underlying repository storage column:

```
// Resources/Post.js

import { Fields } from '@avonjs/avonjs';


/**
* Get the fields available on the entity.
*/
public fields(request: AvonRequest): Field[] {
    return [
        new Fields.ID().filterable().orderable(),
        new Fields.Text('name').filterable().orderable(),
    ];
}
```

## Showing / Hiding Fields

Often, you will only want to display a field in certain situations. For example, there is typically no need to show a `Password` field on a resource index listing. Likewise, you may wish to only display a `Created At` field on the creation / update forms. Avon makes it a breeze to hide / show fields on certain pages.

The following methods may be used to show / hide fields based on the display context:

- showing
  - `showOnIndex`
  - `showOnDetail`
  - `showOnReview`
  - `showOnAssociation`
  - `showOnCreating`
  - `showOnUpdating`
- hiding
  - `hideFromIndex`
  - `hideFromDetail`
  - `hideFromReview`
  - `hideFromAssociation`
  - `hideWhenCreating`
  - `hideWhenUpdating`
- other
  - `onlyOnIndex`
  - `onlyOnDetail`
  - `onlyOnReview`
  - `onlyOnAssociation`
  - `onlyOnForms`
  - `exceptOnForms`

You may chain any of these methods onto your field's definition in order to instruct Avon where the field should be displayed:

```
new Fields.ID().exceptOnForms()
```

Alternatively, you may pass a callback to that methods as following;
For `show*` methods, the field will be displayed if the given callback returns `true`:

```
new Fields.Text('name').exceptOnForms((request, resource) => {
    return resource?.name === 'something';
}),
```

For `hide*` methods, the field will be hidden if the given callback returns `true`:

```
new Fields.Text('name').hideFromIndex((request, resource) => {
    return resource?.name === 'something';
}),
```

## Dynamic Field Methods

If your application requires it, you may specify a separate list of fields for specific display contexts. The available methods that may be defined for individual display contexts are:

- `fieldsForIndex`
- `fieldsForDetail`
- `fieldsForReview`
- `fieldsForCreate`
- `fieldsForUpdate`
- `fieldsForAssociation`

**Dynamic Field Methods Precedence**
The `fieldsForIndex`, `fieldsForDetail`, `fieldsForReview`, `fieldsForCreate`, `fieldsForUpdate` and `fieldsForAssociation` methods always take precedence over the `fields` method.

## Default Values

There are times you may wish to provide a default value to your fields. Avon offers this functionality via the `default` method, which accepts callback. The result value of the callback will be used as the field's default input value on the resource's `creation` API:

```
new Fields.Text('name').default((request) => 'create something')
```

## Field Hydration

On every create or update request that Avon receives for a given resource, each field's corresponding model attribute will automatically be filled before the model is persisted to the database. If necessary, you may customize the hydration behavior of a given field using the `fillUsing` method:

```
new Fields.Text('name').fillUsing((request, model, attribute, requestAttribute) => {
    model.setAttribute(
        attribute,
        request.string(attribute) + ' - ' + Date.now()
    );
}),
```

## Field Types

- [Array Field](#array-field)
- [Binary](#binary-field)
- [DateTime](#datetime-field)
- [Email Field](#email-field)
- [ID Field](#id-field)
- [Json Field](#json-field)
- [List Field](#list-field)
- [Integer Field](#integer-field)
- [Decimal Field](#decimal-field)
- [Text Field](#text-field)
- [Enum Field](#enum-field)

### Array Field

The `Array` field pairs nicely with model attributes that are cast to `array` or equivalent:

```
import { Fields } from '@avonjs/avonjs';

new Fields.Array('tags')
```

You may restrict the length of an array with the `min` and `max` methods:

```
new Fields.Array('title').min(1).max(120)
```

Alternatively, you can set a specific `length`:

```
new Fields.Array('title').length(3)
```

### Binary Field

The `Binary` field may be used to represent a boolean / "tiny integer" column in your database. For example, assuming your database has a boolean column named `active`, you may attach a `Binary` field to your resource like so:

```
import { Fields } from '@avonjs/avonjs';


new Fields.Binary('active').rules(Joi.required()).nullable(false)
```

### DateTime

The `DateTime` field may be used to store a `datetime` value.

```
import { Fields } from '@avonjs/avonjs';


new Fields.DateTime('publish_at'),
```

The `format` method allows you to customize the date format that accepts any valid [moment](https://momentjs.com) formatting.

### Email Field

The `Email` field may be used to store a `email` value.

```
import { Fields } from '@avonjs/avonjs';


new Fields.Email('mail'),
```

### ID Field

The `ID` field represents the primary key of your resource's repository model. Typically, each Avon resource you define should contain an `ID` field. By default, the `ID` field assumes the underlying storage column is named `id`; however, you may pass the column name when creating an `ID` field:

```
import { Fields } from '@avonjs/avonjs';

new Fields.ID()
```

### Json Field

The `Json` field provides a convenient interface to edit, `key-value` data stored inside `JSON` column types. For example, you might store some information inside a `JSON` column type (opens new window) named `meta`:

```
import { Fields } from '@avonjs/avonjs';

new Fields.Json('meta', [
    new Fields.Text('title').creationRules(Joi.required()),
])
```

You are free to pass any non-relational field as second parameters of `Json` field to shape and validate its entire data.

### List Field

The `List` field offers a user-friendly interface for editing arrays of `key-value` data stored within `JSON` column types. the list field is a combination of `Json` field and `Array` field:

```
import { Fields } from '@avonjs/avonjs';

new Fields.List('comments', [
    new Fields.Text('name').creationRules(Joi.required()),
    new Fields.Text('comment').creationRules(Joi.required()),
])
```

You are free to pass any non-relational field as second parameters of `List` field to shape and validate its entire data.

### Integer Field

The `Integer` field store / retrieve value as `integer` in the model:

```
import { Fields } from '@avonjs/avonjs';

new Fields.Integer('hits')
```

You can restrict the range of values accepted for a field in your application by using the `min` and `max` methods:

```
new Fields.Integer('price').min(1).max(10000)
```

### Decimal Field

The `Decimal` field store / retrieve value as `float` in the model:

```
import { Fields } from '@avonjs/avonjs';

new Fields.Decimal('price')
```

The `precision` method helps you to specify the maximum number of decimal places:

```
new Fields.Decimal('price').precision(2)
```

## Text Field

The `Text` field store / retrieve value as `string` in the model:

```
import { Fields } from '@avonjs/avonjs';

new Fields.Text('name')
```

You may define constraints on the length of text input for a field in your application using the `min` and `max` methods

```
new Fields.Text('title').min(1).max(120)
```

## Enum Field

The `Enum` field store / retrieve certain values as `string` in the model. The enum field accepts a list of possible values as the second parameter:

```
import { Fields } from '@avonjs/avonjs';

new Fields.Enum('status', ['published', 'draft'])
```

## Customization

### Nullable Fields

By default, Avon attempts to store all fields with a value, however, there are times where you may prefer that Avon store a `null` value in the corresponding storage column when the field is empty. To accomplish this, you may invoke the `nullable` method on your field definition:

```
new Fields.DateTime('publish_at').nullable()
```

You may also set which values should be interpreted as a `null` value using the `nullValues` method, which accepts an function as validator:

```
new Fields.DateTime('publish_at').nullable().nullValues((value) => ['', undefined, null].includes(value));
```

### Optional Fields

By default, Avon attempts to validate all fields in a request. However, there are situations where certain fields may not be required in the request. To make a field optional, you can invoke the `optional` method on your field definition.

#### Example: Making a DateTime Field Optional

To define a DateTime field that is not required in the request, use the `optional` method as shown below:

```javascript
new Fields.DateTime('publish_at').optional();
```

#### Usage

This approach ensures that the `publish_at` field is not required during validation. If the field is omitted in the request, it will not trigger a validation error.

Here’s a more comprehensive example within a resource definition:

```javascript
import Fields from 'avon';

export default class PostResource extends Resource {
  // Other field definitions...

  fields() {
    return [
      // Other fields...

      new Fields.DateTime('publish_at').optional(),
    ];
  }
}
```

In this example, the `publish_at` field is defined as a DateTime field that can be optionally included in the request. When omitted, it will be considered valid by Avon’s validation logic.

## Filterable Fields

The `filterable` method allows you to enable convenient, automatic filtering functionality for a given field on the resource's index:

```
new Fields.Text('name').filterable()
```

Also its possible to passing a callback to customize the filtering behavior:

```
new Fields.Text('name').filterable((request, repository, value) => {
    repository.where({
        key: this.filterableAttribute(request),
        operator: Constants.Operator.like,
        value,
    });
})

```

## Orderable Fields

When attaching a field to a resource, you may use the `orderable` method to indicate that the resource index may be sorted by the given field:

```
new Fields.Text('name').orderable()
```

Also its possible to passing a callback to customize the ordering behavior:

```
new Fields.Text('name').orderable((request, repository, direction) => {
    repository.order({
        key: 'another key',
        direction: 'desc',
    });
})
```

## Lazy Fields

During development, you may need to resolve the value of certain fields based on the resolved resource. For this situation, you can create a new field that extends the `Lazy` class. This allows you to dynamically compute and set the field's value based on additional data fetched asynchronously.

Here's an example of how to create and use a `Lazy` field:

### Example: MessageCounter Field

```javascript
export default class MessageCounter extends Fields.Lazy {
  /**
   * Resolve necessary data for the given resources and set the resolved values.
   */
  async resolveForResources(
    request: AvonRequest,
    resources: Array<Contracts.Model & HasMessages>,
  ): Promise<void> {
    // Fetch unread message counts for the given resources and user
    const counts = await this.countUnreadMessages(
      resources.map((resource) => resource.filterKey()),
      [Number(request.user()?.userId)].filter((id) => id),
    );

    // Set the message count attribute on each resource
    resources.forEach((resource) => {
      const count = counts.find(
        ({ filter }) => resource.filterKey() === filter,
      );

      resource.setAttribute(this.attribute, count?.count ?? 0);
    });
  }

  /**
   * Count unread messages for the given filters and user IDs.
   */
  async countUnreadMessages(
    filters: Array<string>,
    userIds: Array<number>,
  ): Promise<Array<{ filter: string, count: number }>> {
    // Your implementation for counting unread messages
  }
}
```

In the `resolveForResources` method, you can fetch the necessary data and set it on the resource. This data can then be used when resolving the field value.

### Using the Lazy Field

To use the `MessageCounter` field, simply include it in your resource definition and it will handle the lazy resolution of the message count for each resource.

```javascript
import MessageCounter from './MessageCounter';

export default class UserResource extends Resource {
  // Other field definitions...

  fields() {
    return [
      // Other fields...

      new MessageCounter('unreadMessages', 'Unread Messages'),
    ];
  }
}
```

This approach allows you to defer the resolution of field values until you have all the necessary data, making your application more flexible and efficient.

## Relationships

In addition to the variety of fields we've already discussed, Avon has support for some relationships. Avon relation fields allows you to handle relationships between resources.

### BelongsTo

The `BelongsTo` field corresponds to a `belongs-to` relationship. For example, let's assume a `Post` resource belongs to a `User` resource. We may add the relationship to our `Post` Avon resource like so:

```
import { Fields } from '@avonjs/avonjs';

new Fields.BelongsTo('users')
```

As you see, `BelongsTo` accepts the `uriKey` of the target resource as first argument. By default `BelongsTo` field guess the `relationship` name from the target resource, but you can pass the second argument when creating a field to change that.
In the example above, Avon will will give `user` value from request and store primary key of the `User` resource in the `user_id` attribute of the `Post` resource. to change that you can follow the below example:

```
new Fields.BelongsTo('users', 'author')
```

now, Avon retrieve `author` from request and store it in the `author_id` of post attributes.

Avon determines the default foreign key name by examining the name of the `relationship` and suffixing the name with a `_` followed by the name of the parent resource model's primary key column. So, in this example, Avon will assume the `User` model's foreign key on the `posts` repository is `author_id`.

However, if the foreign key for your relationship does not follow these conventions, `withForeignKey` method allows you change the foreign key of the relation:

```
new Fields.BelongsTo('users', 'author').withForeignKey('user_id')
```

Also, Avon use the `id` column of the parent model to store as foreign key. If your parent model does not use `id` as its primary key, or you wish to find the associated model using a different column you can use the `withOwnerKey` method to specifying your parent table's custom key:

```
new Fields.BelongsTo('users', 'author').withOwnerKey('userId')
```

Now, Avon try to find the related `user` by `userId`.

#### Nullable Relationships

If you would like your `BelongsTo` relationship to be `nullable`, you may simply chain the nullable method onto the field's definition:

```
new Fields.BelongsTo('users', 'author').nullable()
```

#### Load related Resource

The `BelongsTo` field only display the related resource foreign key on the `detail` and `index` API but some times you need to load the related resource instead of foreign key. for example you want to see the `User` record on the `Post` api. for this situation you can use the `load` method on the `BelongsTo` field:

```
new Fields.BelongsTo('users').load()
```

#### Filter Trashed Items ​

By default, the `BelongsTo` field includes soft-deleted records when pre-loaded; however, this can be disabled using the `withoutTrashed` method:

```
new Fields.BelongsTo('users', 'author').withoutTrashed()
```

### HasMany

The `HasMany` field corresponds to a `one-to-many` relationship. A one-to-many relationship is used to define relationships where a single model is the parent to one or more child models. For example, a use may have a many posts in the blog. We may add the relationship to our `User` Avon resource like so:

```
import { Fields } from '@avonjs/avonjs';

new Fields.HasMany('posts')
```

Like another relationships, `HasMany` accepts the `uriKey` of the target resource as first argument Also, guess the `relationship` name from the target resource, but you can pass the second argument when creating a field to change that.

```
import { Fields } from '@avonjs/avonjs';

new Fields.HasMany('posts', 'latestPosts')
```

Avon determines the default foreign key name by examining the name of the resource and suffixing the name with a `_` followed by the name of the resource model's primary key column. So, in this example, Avon will assume the `User` model's foreign key on the `posts` repository is `user_id` but, the `withForeignKey` method allows you to change this behavior. so let assume the `User` id column stored as `author_id` on the posts record, so example will be change like following:

```
new Fields.HasMany('posts', 'latestPosts').withForeignKey('author_id')
```

Also if you are using the another key instead of `id` of the resource, you can change the `HasMany` field like below:

```
new Fields.HasMany('posts', 'latestPosts').withOwnerKey('userId')
```

### HasOne

The `HasOne` field corresponds to a `one-to-one` relationship. For example, let's assume a `User` Avon resource hasOne `Profile` Avon resource. this field is like the `HasMany` field, and the only thing that has changed is the result of loaded resources that limited only into one. so the following example will load only the one related resource detail:

```
new Fields.HasOne('posts', 'latestPosts').withForeignKey('author_id')
```

### BelongsToMany

The `BelongsToMany` field corresponds to a `many-to-many` relationship. For example, let's assume a `Post` Avon resource has many `Tag` Avon resource and in reverse `Tag` Avon resource has many `Post` Avon resource. to show the related `Tag` records on the `Post` resource `index` / `detail` api, we need two another more resource to hold the `pivot` table. so we have to create `PostTag` Avon resource to store joining records. we may add the relationship on the `Post` resource like so:

```
import { Fields } from '@avonjs/avonjs';

new Fields.BelongsToMany('tags', 'post-tags')
```

The `BelongsToMany` field stores the primary key of the resource and related resource into the pivot resource into attributes by examining the name of the them and suffixing the name with a `_` followed by the name of the model's primary key column. the `setResourceForeignKey` method allows you to change attribute name for the `resource` and `withForeignKey` change the `related-resource` attribute foreign key name:

```
new Fields.BelongsToMany('tags', 'post-tags').setResourceForeignKey('postKey').withForeignKey('tagKey')
```

Also if you are using another key to reefer the resource or the related resource, `setResourceOwnerKey` and `withOwnerKey` allows to change this attributes like so:

```
new Fields.BelongsToMany('tags', 'post-tags').setResourceForeignKey('postKey').withForeignKey('tagKey').setResourceOwnerKey('name').withOwnerKey('name')
```

#### Pivot Fields

If your `belongsToMany` relationship interacts with additional "pivot" fields that are stored on the intermediate table of the many-to-many relationship, you may also attach those to your `BelongsToMany` Avon relationship.

For example, let's assume our `Post` model `belongsToMany` `Tag` resource. On our `post-tag` intermediate storage, let's imagine we have a `order` attribute that contains ordering of relationship. We can attach this `pivot` attribute to the `BelongsToMany` field using the `pivots` method:

```
new Fields.BelongsToMany('tags', 'post-tags').pivots((request) => {
    return [
        Integer('order'),
    ];
})
```

#### Load related Resource

The `BelongsToMany` field does not display the related resource on the `detail` and `index` API but the `load` method allows you to meet the attached resource like so:

```
new Fields.BelongsToMany('tags').load()
```

### Customization

### Relatable Resource Formatting

By default, when you load the relationship fields on the resource API, Avon use the index fields to format the related resource. If you would like to customize the related resource attributes on the `parent` or `child` API, the `fields` method on the relationship fields allows you to pass some fields to change the display attributes like so:

```
new Fields.BelongsTo('users').load().fields((request) => {
    return [
        new Fields.Text('name'),
        new Fields.ID(),
    ]
})
```

Also on the `BelongsToMany` relationship you can access `pivot` values:

```
new Fields.BelongsToMany('tags').load().fields((request) => {
    return [
        new Fields.Text('name'),
        new Integer('order', (value, resource) => {
            return resource.getAttribute('pivot').getAttribute('order')
        })
    ]
})
```

### Relatable Resource Filtering & Ordering

The `filterable` and `orderable` methods can also be applied to association fields, enabling you to filter and order related resources. Here's an example of how to use these methods with a BelongsTo association:

```
new Fields.BelongsTo('users').load().fields((request) => {
    return [
        new Fields.Text('name').filterable().orderable(),
        new Fields.ID(),
    ]
})
```

By utilizing these methods, you can enhance the `filtering` and `ordering` capabilities of your resource associations. Adjust the fields and methods as needed to suit your application's requirements.

### Relatable Query Filtering

For now, the `BelongsToMany` and `BelongsTo` relationship field's, allows you to modify their results on the create / update API. for common use case when you want to display the select fields on the UI, you need an API to get related resource for this fields. Fortunately, Avon create an extra API for this types of relationships that enables you to have an specific customizable API for each field. For example, if you have a `BelongsTo` field on the `Post` resource to show the author of the post, you will see an API like `/api/resources/posts/associable/user` on the swagger-ui. If you would like to customize the association query, you may do so by invoking the `relatableQueryUsing` method:

```
new Fields.BelongsTo('users').relatableQueryUsing((request, repository) => {
    return repository.where({
        key: 'role',
        operator: Constants.Operator.like,
        value : 'admin'
    })
})
```

### Limiting Relation Results

You can limit the number of results that are returned when searching the field by defining a `relatableSearchResults` property on the class of the resource that you are searching for:

```
/**
* The number of results to display when searching relatable resource.
*/
relatableSearchResults = 5;
```

## Validation

Unless you like to live dangerously, any Avon fields that are displayed on the Avon creation / update pages will need some validation. Thankfully, it's a cinch to attach all of the [Joi](https://joi.dev/api) validation rules you're familiar with to your Avon resource fields. Let's get started.

## Attaching Rules

When defining a field on a resource, you may use the `rules` method to attach validation rules to the field:

```
new Fields.Text('name').rules(Joi.string())
```

## Creation Rules

If you would like to define rules that only apply when a resource is being created, you may use the `creationRules` method:

```
new Fields.Text('name').rules(Joi.string()).creationRules(Joi.required())
```

## Update Rules

Likewise, if you would like to define rules that only apply when a resource is being updated, you may use the `updateRules` method:

```
new Fields.Text('name').rules(Joi.string()).creationRules(Joi.required()).updateRules(Joi.optional())
```

## Authorization

When Avon is accessed only by you or your development team, you may not need additional authorization before Avon handles incoming requests. However, if you provide access to Avon to your clients or a large team of developers, you may wish to authorize certain requests. For example, perhaps only administrators may delete records. Thankfully, Avon takes a simple approach to authorization.

### API

To limit which users may `view`, `create`, `update`, `delete`, `forceDelete`, `restore`, `attach`, `detach` and `add` resources, you can override the authorization methods:

- `authorizedToViewAny`
- `authorizedToView`
- `authorizedToCreate`
- `authorizedToUpdate`
- `authorizedToDelete`
- `authorizedToForcDelete`
- `authorizedToRestore`
- `authorizedToReview`
- `authorizedToAdd`
- `authorizedToAttach`
- `authorizedToDetach`

### Disabling Authorization

If you want to disable authorization for specific resource (thus allowing all actions), change `authorizable` method to return `false`:

```
/**
* Determine if need to perform authorization.
*/
public authorizable(): boolean {
    return false;
}
```

### Fields

Sometimes you may want to prevent updating certain fields by a group of users. You may easily accomplish this by chaining the `canSee` method onto your field definition. The `canSee` method accepts a function which should return `true` or `false`. The function will receive the incoming HTTP request:

```
new Fields.Binary('active').canSee((request) => false)
```

# Repositories

## Defining Repositories

Repositories in AvonJS provide a structured way to interact with APIs and manage data storage. By default, all repositories are stored in the `repositories` directory. You can generate a repository using the `make:repository` Avon command as follows:

```bash
avonjs make:repository Posts
```

or with soft deletes:

```bash
avonjs make:repository Posts --soft-deletes
```

Each repository within AvonJS is designed to return data formatted according to a specific model. To define these models, you can refer to the [instructions on defining models](#defining-models) provided later in the documentation.

## Preset Repositories

Avon by default, ships with a variety of repositories:

- [Collection Repository](#collection-repository)
- [File Repository](#file-repository)
- [Knex Repository](#knex-repository)

### Collection Repository

The collection repository holds records under the memory RAM so it will lose data after operations or application restarts. this repository is good when you want to serve an array of data as an API. you could create a collection repository like so:

```bash
avonjs make:repository Posts --collection
```

or with soft deletes:

```bash
avonjs make:repository Posts --collection --soft-deletes
```

### File Repository

The file repository is a type of collection repository with a bit of change. as the collection repository stores data on the memory, the File repository, holds data in the JSON file. to create a file repository you have to create a class like the below and define the store file path.

```bash
avonjs make:repository Posts --file
```

or with soft deletes:

```bash
avonjs make:repository Posts --file --soft-deletes
```

### Knex Repository

The Knex repository stores data on the database and uses [knex.js](https://knexjs.org/) package to maintain data. you could use it like so:

```bash
avonjs make:repository Posts --knex
```

or with soft deletes:

```bash
avonjs make:repository Posts --knex --soft-deletes
```

## Defining Models

Each model is a class which implements `Model` interfaces. you may generate a model like so:

```bash
avonjs make:model Post
```

By default Avon ships by a simple `Fluent` model and you could use it as your model or base model if you want!

```
import { Models } from '@avonjs/avonjs';

export default class MyModel extends Models.Fluent {
    //
}
```

## Soft Deletes

In addition to actually removing records from your repository, Avon can also "soft delete" records. When records are soft deleted, they are not actually removed from your database. Instead, a `deleted_at` attribute is set on the model indicating the date and time at which the model was "deleted". To enable soft deletes for a repository, extend the base repository by `SoftDeletes` mixins provided by Avon:

```
//@ts-check
const { Repositories, SoftDeletes } = require('@avonjs/avonjs');
const { dirname, join } = require('path');

module.exports = class Categories extends (
  SoftDeletes(Repositories.File)
) {
  filepath() {
    return join(dirname(__dirname), 'storage', 'categories.json');
  }
  searchableColumns() {
    return [];
  }
};
```

Soft deletes could apply to all type of repositories and also extends your API by three additional APIs.

## Timestamps

Avon includes the `Timestamps` mixins for conveniently setting operation dates on the repository. Here's how you can use it:

```javascript
//@ts-check
const { Repositories, Timestamps } = require('@avonjs/avonjs');

module.exports = class Categories extends Timestamps(Repositories.File) {
  // Your code here
};
```

The `Timestamps` mixin can be applied to all types of repositories to automatically set "created_at" and "updated_at" dates on the models when they're not set yet.

To customize the timestamps columns, you can override the `getCreatedAtKey` and `getUpdatedAtKey` methods. For example:

```javascript
class MyRepository extends Timestamps(BaseRepository) {
  getCreatedAtKey() {
    return 'my_created_at_column';
  }

  getUpdatedAtKey() {
    return 'my_updated_at_column';
  }
}
```

To modify the timestamps' values, you can change the `freshTimestamp` method according to your requirements. This method is responsible for providing the current timestamp when creating or updating records.

# Filters

## Defining Filters

- [Select Filter](#select-filter)
- [Boolean Filter](#select-filter)
- [Range Filter](#range-filter)
- [Text Filter](#text-filter)
- [DateTime Filter](#date-time-filter)
- [ResourceId Filter](#resource-id-filter)

  Avon filters are simple classes that allow you to scope your Avon index queries with custom conditions.

- _Before creating your own filters, you may want to check out [filterable fields](#filterable-fields). Filterable fields can solve the filtering needs of most Avon installations without the need to write custom code._

To create a filter you can use the Avon `make:filter` command like so:

```bash
avonjs make:filter ActivePosts
```

By default, Avon will place newly generated filters in the `avonjs/filters` directory. Each filter is a class that extended the base class filters and contains an `apply` method to modifying underlying repository query:

```
// filters/ActivePosts.js

import { Filters, Constants } from '@avonjs/avonjs';

export class ActivePosts extends Filters.Filter {
    /**
    * Apply the filter into the given repository.
    */
    apply(request, repository,value) {
        return repository.where({
            key: 'state',
            value: 'active',
            operator: Constants.Operator.eq
        })
    }
}
```

### Select Filter

The most common type of Avon filter is the "select" filter, which allows the user to select a filter option from a drop-down selection menu on the swagger-ui. You may generate a select filter using the `make:filter` Avon command.

```bash
avonjs make:filter ActivePosts --select
```

Each `SelectFilter` should have the `options` method that defines the "values" the filter may have.

```
// Filters/FilterByRoles.js

import { Filters } from '@avonjs/avonjs';

export class FilterByRoles extends Filters.Select {
    * Apply the filter into the given repository.
    */
    apply(request, repository, value) {
        // modify query
    }

    /**
    * Get the possible filtering values.
    */
    public options(): any[] {
        return ['admin', 'user'];
    }
}
```

### Boolean Filter

The Avon "boolean" filters, allow the user to determine a filter should apply on the resource or not. . You may generate a select filter using the `make:filter` Avon command:

```bash
avonjs make:filter ActivePosts --select
```

### Range Filter

The "range" filters allow the user to chose records that has a value between a specific range. to create a range filter you may use the `make:filter` Avon command:

```bash
avonjs make:filter FilterByHits --range
```

## Registering Filters

Once you have defined a filter, you are ready to attach it to a resource. Each resource created by Avon contains a `filters` method. To attach a filter to a resource, you should simply add it to the array of filters returned by this method:

```
/**
* Get the filters available on the entity.
*/
public filters(request: AvonRequest): Filter[] {
  return [
    new ActivePosts(),
  ];
}
```

After attaching a filter to the resource, the filter will appear in the swagger-ui index API.

## Authorization Filters

If you need to limit the user to run filters, the `canSee` method gives a `function` that receive the current request that should return `true` or `false` to determine user can use the filter or not. if an restricted filter appear in the request, the Avon will ignore it:

```
new FilterByHits().canSee((request) => false)
```

# Orderings

## Defining Orderings

Avon orderings are simple classes that allow you to order your Avon index queries with custom conditions.

- _Before creating your own orderings, you may want to check out [orderable fields](#orderable-fields). orderable fields can solve the ordering needs of most Avon installations without the need to write custom code._

To create a ordering you have to use `make:ordering` Avon command like so:

```bash
avonjs make:ordering OrderByFullName
```

By default, Avon will place newly generated orderings in the `avonjs/orderings` directory. Each "ordering" is a class that extended the base class orderings and contains an `apply` method to modifying underlying repository query:

```
// Orderings/OrderByFullName.js
import { Orderings } from '@avonjs/avonjs';

export class OrderByFullName extends Orderings.Ordering {
    /**
    * Apply the ordering into the given repository.
    */
    apply(request, repository, direction) {
        // modify query
    }
}
```

## Registering Orderings

Once you have defined a ordering, you are ready to attach it to a resource. Each resource created by Avon contains a `orderings` method. To attach a ordering to a resource, you should simply add it to the array of orderings returned by this method:

```
/**
* Get the orderings available on the entity.
*/
public orderings(request: AvonRequest): Ordering[] {
  return [
    new OrderByFullName(),
  ];
}
```

After attaching a ordering to the resource, the ordering will appear in the swagger-ui index API.

## Authorization Orderings

If you need to limit the user to run orderings, the `canSee` method gives a `function` that receive the current request that should return `true` or `false` to determine user can use the ordering or not. if an restricted ordering appear in the request, the Avon will ignore it:

```
new OrderingByHits().canSee((request) => false)
```

# Actions

## Defining Actions

Avon actions allow you to perform custom tasks on one or more resource records. For example, you might write an action that sends an email to a user containing account data they have requested. Or, you might write an action to transfer a group of records to another user.

Once an action has been attached to a resource definition, you can see extra API on the swagger-ui. to create an action you have to use the `make:action` Avon command:

```bash
avonjs make:action Publish
```

The most important method of an action is the `handle` method. The `handle` method receives the values for any fields attached to the action, as well as a collection of selected models. The `handle` method always receives a Collection of models, even if the action is only being performed against a single model.

Within the `handle` method, you may perform whatever tasks are necessary to complete the action. You are free to update database records, send emails, call other services, etc. The sky is the limit!

## Action Fields

Sometimes you may wish to gather additional information from the user before dispatching an action. For this reason, Avon allows you to attach most of Avon's supported [fields](#fields) directly to an action. To add a field to an action, add the field to the array of fields returned by the action's `fields` method:

```
/**
* Get the fields available on the action.
*/
public fields(request: AvonRequest): Field[] {
    return [];
}
```

## Action Responses

Typically, when an action is executed, a "success" response will create by Avon. However, you are free to return your custom response:

```
import { AvonResponse } from "avonjs";

/**
*Perform the action on the given models.
*/
protected async handle(fields: Fluent, models: Model[]): Promise<AvonResponse | undefined> {
    // perform action

    return new (class extends AvonResponse {
        constructor(meta = {}) {
            super(201, {}, { ...meta, type: 'PublishedResponse is my custom response'});
        }
    })();
}
```

## Registering Actions

Once you have defined an action, you are ready to attach it to a resource. Each resource created by Avon contains an `actions` method. To attach an action to a resource, you should simply add it to the array of actions returned by this method:

```
/**
* Get the actions available on the entity.
*/
actions(request){
    return [
        new Publish()
    ];
}
```

## Authorization Actions

If you would like to only expose a given action to certain users, you may invoke the `canSee` method when registering your action. The `canSee` method accepts a function which should return `true` or `false`. The function will receive the incoming HTTP request:

```
new Publish().canSee(request => false)
```

Sometimes a user may be able to "run" that an action exists but only against certain resources. you may use the `canRun` method in conjunction with the `canSee` method to have full control over authorization in this scenario. The callback passed to the `canRun` method receives the incoming HTTP request and the resource model:

```
new Publish().canRun((request, model) => model.getKey() % 2 === 0)
```

## Standalone Actions

Typically, actions are executed against resources selected on a resource index or detail API. However, sometimes you may have an action that does not require any resources / models to run. In these situations, you may register the action as a "standalone" action by invoking the `standalone` method when registering the action. These actions always receives an empty collection of models in their `handle` method:

```
/**
* Get the actions available on the entity.
*/
actions(request){
    return [
        new Publish().canRun(request => false)
    ];
}
```

# Activity Log

## Action Events

It is often useful to view a log of the actions that have been run against a particular resource. Thankfully, Avon stores any actions that manipulate records. but by default, we store the logs on the memory, so data will be lost after restarts or any memory cleanups. to prevent losing data, you could define your custom repository for action events per each resource:

```
//@ts-check
const { Resource } = require('@avonjs/avonjs');
const Activities = require('../repositories/Activities');

abstract class BaseResource extends Resource {
    actionRepository() {
        return new Activities();
    }
}
```

### Custom Action Event

All action events repository should implements `ActionEventRepository` interface on the typescript. Fortunately, Avon has a mixin to help you make custom action event repositories without any trouble. To define your custom action event repository you could use `FillsActionEvents` mixin to extends your repository like so:

```
//@ts-check
const { Repositories, FillsActionEvents } = require('@avonjs/avonjs');
const { dirname, join } = require('path');

class Activities extends FillsActionEvents(Repositories.File) {
    filepath() {
        return join(dirname(\_\_dirname), 'storage', 'activities.json');
    }
    searchableColumns() {
        return [];
    }
};
```

### Action Event Table

The action events table structure should be defined as follows:

```
import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTableIfNotExists('action_events', (table) => {
    table.bigIncrements('id').primary();
    table.text('name');
    table.text('model_type');
    table.bigInteger('model_id');
    table.text('resource_name');
    table.bigInteger('resource_id');
    table.bigInteger('user_id');
    table.text('batch_id');
    table.json('payload').nullable();
    table.json('changes').nullable();
    table.json('original').nullable();
    table.timestamps(true, true);
    table.timestamp('deleted_at');
    // Indexes
    table.index(['model_type', 'model_id'], 'morphs');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('action_events');
}

```

# Error Handling

## Register Error Handler

The `handleErrorUsing` on the Avon allows you to register a custom callback to handle errors:

```
Avon.handleErrorUsing((error) => console.error(error))
```
