# Search Queries

In addition to [structured queries](./structured-queries.md), persist also supports fuzzy search across fields indexed for search.

## Indexing Data for Search

To set index properties on a model for search, define the static function `searchProperties` as an arrow function that returns an array of fields that should be indexed for search.

Let's consider the following models:

```javascript
import Persist from "@acodeninja/persist";

export class Person extends Persist.Model {
    static {
        Person.name = Persist.Property.String.required;
        Person.address = () => Address;
        Person.searchProperties = () => ['name', 'address.address'];
    }
}

export class Address extends Persist.Model {
    static {
        Address.address = Persist.Property.String.required;
        Address.postcode = Persist.Property.String.required;
        Address.searchProperties = () => ['address', 'postcode'];
    }
}
```

Every time a `Person` model is put to a storage engine, the person's name and address are saved to the search index and can be queried.

## Searching

To search for any `Person` who lives on station road, the following search query can be run:

```javascript
import Persist from "@acodeninja/persist";

const connection = Persist.getConnections('people');

await connection.search(Person, 'station road');
```

This will find all matches for people who live at any address that includes `station road`.
