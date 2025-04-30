# Structured Queries

Use structured queries when you need to filter a collection of models using a series of exact and partial matching conditions.

## Indexing Data

To set index properties on a model, define the static function `indexProperties` as an arrow function that returns an array of fields that should be indexed for querying.

Let's consider the following models:

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        Person.name = Persist.Property.String.required;
        Person.address = () => Address;
        Person.indexProperties = () => ['name', 'address.postcode'];
    }
}

export class Address extends Persist.Model {
    static {
        Address.address = Persist.Property.String.required;
        Address.postcode = Persist.Property.String.required;
        Address.people = () => Persist.Property.Array.of(Person)
        Address.indexProperties = () => ['postcode', 'people.[*].name'];
    }
}
```

Every time a `Person` model is put to a storage engine, the person's name and address postcode are saved to the index and can be queried.

> [!NOTE]
> All fields included in the model index will be stored in the same file so be careful not to index fields that contain a lot of data.

## Querying Exact Matches

To query for a `Person` called `Joe Bloggs` an exact query can be written:

```javascript
import Persist from "@acodeninja/persist";

const connection = Persist.getConnection('people');

await connection.find(Person, {
    name: {$is: 'Joe Bloggs'},
});
```

## Querying Partial Matches

To query for a `Person` with name `Joe` a contains query can be written:

```javascript
import Persist from "@acodeninja/persist";

const connection = Persist.getConnection('people');

await connection.find(Person, {
    name: {$contains: 'Joe'},
});
```

## Querying One-to-Many Model links

To query for all instances of `Address` with a linked `Person` with a name that contains `Joe` you can write:

```javascript
import Persist from "@acodeninja/persist";

const connection = Persist.getConnection('people');

await connection.find(Address, {
    people: {
        $contains: {
            name: {$contains: 'Joe'},
        },
    },
});
```

## Querying Combination Matches

To query for a `Person` who lives at `SW1 1AA` a combination of contains and exact queries can be written:

```javascript
import Persist from "@acodeninja/persist";

const connection = Persist.getConnection('people');

await connection.find(Person, {
    address: {
        $contains: {
            postcode: {$is: 'SW1 1AA'},
        },
    },
});
```

## Multiple Queries

To query for anyone called `Joe Bloggs` who lives in the `SW1` postcode area, we can combine queries:

```javascript
import Persist from "@acodeninja/persist";

const connection = Persist.getConnection('people');

await connection.find(Person, {
    name: {$is: 'Joe Bloggs'},
    address: {
        $contains: {
            postcode: {$contains: 'SW1'},
        },
    },
});
```
