# Model Properties

Persist uses a type definition for the properties of each model, this allows for validation and type coercion when saving and retrieving data.

Model properties can be assigned a `Type`, or another `Model`. For more information on see [Models as Properties](./models-as-properties.md).

## Defining Model Properties

Properties can be defined on a model by setting static properties to the value of a type on the class that describes the model.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.firstName = Persist.Property.String;
        Person.lastName = Persist.Property.String;
    }
}
```

## Simple Properties

### `Persist.Property.String`

Use the `String` type for model properties that should store a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String). The `String` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.firstName = Persist.Property.String;
        Person.lastName = Persist.Property.String.required;
    }
}
```

### `Persist.Property.Boolean`

Use the `Boolean` type for model properties that should store a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean). The `Boolean` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.markettingEmailsActive = Persist.Property.Boolean;
        Person.accountActive = Persist.Property.Boolean.required;
    }
}
```

### `Persist.Property.Number`

Use the `Number` type for model properties that should store a [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). The `Number` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.loginToken = Persist.Property.Number;
        Person.accountId = Persist.Property.Number.required;
    }
}
```

### `Persist.Property.Date`

Use the `Date` type for model properties that should store a [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date). The `Date` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

A property of `Date` will serialise to an ISO 8601 date format like `2011-10-05T14:48:00.000Z` when `.toData` is called on a model.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.lastLogin = Persist.Property.Date;
        Person.createdAt = Persist.Property.Date.required;
    }
}
```

## Complex Properties

### `Persist.Property.Array.of(type)`

Use the `Array` type for model properties that should store an array of another type or model. The `Array` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.failedLoginAttempts = Persist.Property.Array.of(Persist.Property.Date);
        Person.fullName = Persist.Property.Array.of(Persist.Property.String).required;
    }
}
```

### `Persist.Property.Custom.of(schema)`

Use the `Custom` type for model properties that should store a custom [json-schema draft-07](https://json-schema.org/draft-07/json-schema-hypermedia) object. You can also use any formats defined by the [`avj-formats`](https://ajv.js.org/packages/ajv-formats.html) library. The `Custom` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.address = Persist.Property.Custom.of({
            type: 'object',
            additionalProperties: false,
            required: ['line1', 'city', 'postcode'],
            properties: {
                line1: {type: 'string'},
                line2: {type: 'string'},
                city: {type: 'string'},
                postcode: {
                    type: 'string',
                    pattern: "^[A-Z]+[0-9]+\s[A-Z]+[0-9]+$",
                },
            },
        }).required;
    }
}
```

## Resolved Properties

Resolved types are different from other types in that they do not directly store data themselves, rather they perform an action on another property of the model.

### `Persist.Property.Resolved.Slug.of(property)`

Use the `Slug` type for model properties that should have a slug version of another properties value. The `Custom` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Page extends Persist.Model {
    static {
        Page.title = Persist.Property.String;
        Page.slug = Persist.Property.Resolved.Slug.of('title');
    }
}

const page = new Page({title: 'A really important article!'});
const {slug} = page.toData();

console.log(slug); // a-really-important-article
```

## Modifiers

Models and most types support a modifier, this will alter the validation and persistence process based on the type of modifier used.

### `.required`

Most types support the `.required` modifier, which will alter validation to enforce the presence of the property when saving data.

```javascript
class RequiredStringModel extends Persist.Model {
    static {
        RequiredStringModel.requiredString = Persist.Property.String.required;
        RequiredStringModel.requiredNumber = Persist.Property.Number.required;
        RequiredStringModel.requiredBoolean = Persist.Property.Boolean.required;
        RequiredStringModel.requiredDate = Persist.Property.Date.required;
        RequiredStringModel.requiredArrayOfString = Persist.Property.Array.of(Persist.Property.String).required;
        RequiredStringModel.requiredArrayOfNumber = Persist.Property.Array.of(Persist.Property.Number).required;
        RequiredStringModel.requiredArrayOfBoolean = Persist.Property.Array.of(Persist.Property.Boolean).required;
        RequiredStringModel.requiredArrayOfDate = Persist.Property.Array.of(Persist.Property.Date).required;
    }
}
```

## Custom Property Types

Under the hood, model validation uses the [ajv](https://ajv.js.org/) library with [ajv-formats](https://ajv.js.org/packages/ajv-formats.html) included. Because of this, you can create your own property types.

Say you want to attach an IPv4 address to your models. The following type class can accomplish this.

```javascript
import Persist from '@acodeninja/persist';

class IPv4Type extends Persist.Property.Type {
    static {
        // Set the type of the property to string
        IPv4Type._type = 'string';
        // Use the ajv extended format "ipv4"
        IPv4Type._format = 'ipv4';
        // Ensure that even when minified, the name of the constructor is IPv4
        Object.defineProperty(IPv4Type, 'name', {value: 'IPv4'});
    }
}
```

This type can then be used in any model as needed.

```javascript
import Persist from '@acodeninja/persist';

class StaticIP extends Persist.Model {
    static ip = IPv4Type.required;
}
```
