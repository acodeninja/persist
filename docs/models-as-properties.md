# Models as Properties

In addition to assigning basic types to model properties, you can assign entire models as properties. This allows for the creation of complex relationships between models. For information on using basic types for properties, refer to [model property types](./model-properties.md).

We’ll explore different types of relationships between models using examples of `Person` and `Address` models, evolving the definition step by step.

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
    }
}

export class Address extends Persist.Model {
    static {
        this.address = Persist.Property.String.required;
        this.postcode = Persist.Property.String.required;
    }
}
```

## One-to-One Relationships

To define a **one-to-one** relationship between two models, set a static property in one model as a function that returns the other model. This ensures that the models can be defined in any order, avoiding issues with initialization.

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
        this.address = () => Address;
    }
}

export class Address extends Persist.Model {
    static {
        this.address = Persist.Property.String.required;
        this.postcode = Persist.Property.String.required;
    }
}
```

> [!IMPORTANT]
> **Why Use an Arrow Function?**
>
> The arrow function allows the model to reference another model that may not have been defined yet. Without it, you might encounter an error like `ReferenceError: Cannot access 'Address' before initialization`. See [Reference Errors](./code-quirks.md#reference-errors).

### Circular One-to-One Relationships

You can extend the previous example by allowing both models to reference each other. This is useful for circular relationships, where querying one model (e.g., `Address`) should also allow access to the related model (e.g., `Person`).

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
        this.address = () => Address;
    }
}

export class Address extends Persist.Model {
    static {
        this.person = () => Person;
        this.address = Persist.Property.String.required;
        this.postcode = Persist.Property.String.required;
    }
}
```

## One-to-Many Relationships

To model a **one-to-many** relationship, use `Persist.Property.Array` to store an array of related models. For instance, if a `Person` can have multiple addresses, this is how it would be defined:

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
        this.addresses = () => Persist.Property.Array.of(Address);
    }
}

export class Address extends Persist.Model {
    static {
        this.person = () => Person;
        this.address = Persist.Property.String.required;
        this.postcode = Persist.Property.String.required;
    }
}
```

This structure allows for querying both the Person and their multiple Address records, while maintaining the ability to retrieve the related person from any address.

## Many-to-Many Relationships

In some cases, you may want to model a many-to-many relationship. For example, if multiple people can live at the same address, this type of relationship is ideal.

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
        this.addresses = () => Persist.Property.Array.of(Address);
    }
}

export class Address extends Persist.Model {
    static {
        this.people = () => Persist.Property.Array.of(Person);
        this.address = Persist.Property.String.required;
        this.postcode = Persist.Property.String.required;
    }
}
```

This allows both `Person` and `Address` models to reference each other as arrays, establishing a many-to-many relationship.

## Combining Relationships

In more complex scenarios, you may want to capture additional information about the relationship itself. For example, when tracking when a person moved to a particular address, you can create an intermediary model (e.g., `Abode`) to store this information.

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
        this.addresses = () => Persist.Property.Array.of(Abode);
    }
}

export class Abode extends Persist.Model {
    static {
        this.moveInDate = Persist.Property.Date.required;
        this.address = () => Address;
        this.person = () => Person;
    }
}

export class Address extends Persist.Model {
    static {
        this.people = () => Persist.Property.Array.of(Person);
        this.address = Persist.Property.String.required;
        this.postcode = Persist.Property.String.required;
    }
}
```

In this setup:

- A `Person` can have multiple `Abode` entries (i.e., where they lived and when they moved in).
- Each `Abode` links a `Person` to an `Address`, while also recording the move-in date.
- An `Address` can still reference multiple people, making this a flexible and more complex relationship model.
