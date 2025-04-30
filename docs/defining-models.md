# Defining Models

Persist allows defining models as JavaScript classes and uses static attributes for the properties of each model, this allows for validation and type coercion when saving and retrieving data.

## Defining a Model

The most basic model is a JavaScript class that extends `Persist.Model`.

```javascript
class BasicModel extends Persist.Model {
}
```

A model will always have an `id` property that is randomly generated using [ULID](https://github.com/ulid/spec).

```javascript
const basic = new BasicModel();

console.log(basic.id) // BasicModel/01ARZ3NDEKTSV4RRFFQ69G5FAV
```

### Adding properties

Model properties can be added to a model using `Persist.Property.*`.

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        Person.name = Persist.Property.String.required;
        Person.dateOfBirth = Persist.Property.Date.required;
        Person.height = Persist.Property.Number.required;
        Person.isStudent = Persist.Property.Boolean.required;
    }
}
```

For a full list of available property types see [Model Property Types](./model-properties).

### Linking Models

Models can be linked to other models by declaring them as properties.

```javascript
class Address extends Persist.Model {
    static {
        Address.address = Persist.Property.String.required;
        Address.postcode = Persist.Property.String.required;
    }
}

class Person extends Persist.Model {
    static {
        Person.name = Persist.Property.String.required;
        Person.address = Address;
    }
}
```

For a look at the ways that models can be linked check out [Models as Properties](./models-as-properties.md).
