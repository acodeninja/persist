# Model Property Types

Persist uses a type definition for the properties of each model, this allows for validation and type coercion when saving and retrieving data.

Model properties can be assigned a `Type`, or another `Model`. For more information on see [Models as Properties](./models-as-properties.md).

## Defining Model Properties

Properties can be defined on a model by setting static properties to the value of a type on the class that describes the model.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.firstName = Persist.Type.String;
        this.lastName = Persist.Type.String;
    }
}
```

## Simple Types

### `Persist.Type.String`

Use the `String` type for model properties that should store a [string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String). The `String` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.firstName = Persist.Type.String;
        this.lastName = Persist.Type.String.required;
    }
}
```

### `Persist.Type.Boolean`

Use the `Boolean` type for model properties that should store a [boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean). The `Boolean` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.markettingEmailsActive = Persist.Type.Boolean;
        this.accountActive = Persist.Type.Boolean.required;
    }
}
```

### `Persist.Type.Number`

Use the `Number` type for model properties that should store a [number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number). The `Number` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.loginToken = Persist.Type.Number;
        this.accountId = Persist.Type.Number.required;
    }
}
```

### `Persist.Type.Date`

Use the `Date` type for model properties that should store a [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date). The `Date` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.lastLogin = Persist.Type.Date;
        this.createdAt = Persist.Type.Date.required;
    }
}
```

## Complex Types

### `Persist.Type.Array.of(type)`

Use the `Array` type for model properties that should store an array of another type or model. The `Array` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.failedLoginAttempts = Persist.Type.Array.of(Persist.Type.Date);
        this.fullName = Persist.Type.Array.of(Persist.Type.String).required;
    }
}
```

### `Persist.Type.Custom.of(schema)`

Use the `Custom` type for model properties that should store a custom [json-schema draft-07](https://json-schema.org/draft-07/json-schema-hypermedia) object. You can also use any formats defined by the [`avj-formats`](https://ajv.js.org/packages/ajv-formats.html) library. The `Custom` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Type.Model {
    static {
        this.address = Persist.Type.Custom.of({
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

## Resolved Types

Resolved types are different from other types in that they do not directly store data themselves, rather they perform an action on another property of the model.

### `Persist.Type.Resolved.Slug.of(property)`

Use the `Slug` type for model properties that should have a slug version of another properties value. The `Custom` type also supports the `.required` modifier to ensure that when the model is persisted a value must exist for it.

```javascript
import Persist from '@acodeninja/persist';

class Page extends Persist.Type.Model {
    static {
        this.title = Persist.Type.String;
        this.slug = Persist.Type.Resolved.Slug.of('title');
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
class RequiredStringModel extends Persist.Type.Model {
    static {
        this.requiredString = Type.String.required;
        this.requiredNumber = Type.Number.required;
        this.requiredBoolean = Type.Boolean.required;
        this.requiredDate = Type.Date.required;
        this.requiredArrayOfString = Type.Array.of(Type.String).required;
        this.requiredArrayOfNumber = Type.Array.of(Type.Number).required;
        this.requiredArrayOfBoolean = Type.Array.of(Type.Boolean).required;
        this.requiredArrayOfDate = Type.Array.of(Type.Date).required;
    }
}
```
