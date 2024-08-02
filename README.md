# @acodeninja/persist

A JSON based data modelling and persistence library with alternate storage mechanisms.

## Models

The `Model` and `Type` classes allow creating representations of data objects

### Defining Models

##### A model using all available basic types

```javascript
import Persist from "@acodeninja/persist";

export class SimpleModel extends Persist.Type.Model {
    static boolean = Persist.Type.Boolean;
    static string = Persist.Type.String;
    static number = Persist.Type.Number;
}
```

##### A simple model using required types

```javascript
import Persist from "@acodeninja/persist";

export class SimpleModel extends Persist.Type.Model {
    static requiredBoolean = Persist.Type.Boolean.required;
    static requiredString = Persist.Type.String.required;
    static requiredNumber = Persist.Type.Number.required;
}
```

##### A simple model using arrays of basic types

```javascript
import Persist from "@acodeninja/persist";

export class SimpleModel extends Persist.Type.Model {
    static arrayOfBooleans = Persist.Type.Array.of(Type.Boolean);
    static arrayOfStrings = Persist.Type.Array.of(Type.String);
    static arrayOfNumbers = Persist.Type.Array.of(Type.Number);
}
```

<details>
  <summary>Complex relationships are also supported</summary>

#### One-to-One Relationships

##### A one-to-one relationship

```javascript
import Persist from "@acodeninja/persist";

export class ModelB extends Persist.Type.Model {
}

export class ModelA extends Persist.Type.Model {
    static linked = ModelB;
}
```

##### A circular one-to-one relationship

```javascript
import Persist from "@acodeninja/persist";

export class ModelA extends Persist.Type.Model {
    static linked = () => ModelB;
}

export class ModelB extends Persist.Type.Model {
    static linked = ModelA;
}
```

#### One-to-Many Relationships

##### A one-to-many relationship

```javascript
import Persist from "@acodeninja/persist";

export class ModelB extends Persist.Type.Model {
}

export class ModelA extends Persist.Type.Model {
    static linked = Persist.Type.Array.of(ModelB);
}
```

##### A circular one-to-many relationship

```javascript
import Persist from "@acodeninja/persist";

export class ModelA extends Persist.Type.Model {
    static linked = () => Type.Array.of(ModelB);
}

export class ModelB extends Persist.Type.Model {
    static linked = ModelA;
}
```

#### Many-to-Many Relationships

##### A many-to-many relationship

```javascript
import Persist from "@acodeninja/persist";

export class ModelA extends Persist.Type.Model {
    static linked = Persist.Type.Array.of(ModelB);
}

export class ModelB extends Persist.Type.Model {
    static linked = Persist.Type.Array.of(ModelA);
}
```
</details>

## Find and Search

Models may expose a `searchProperties()` and `indexProperties()` static method to indicate which 
fields should be indexed for storage engine `find()` and `search()` methods.

Use `find()` for a low usage exact string match on any indexed attribute of a model.

Use `search()` for a medium usage fuzzy string match on any search indexed attribute of a model.

```javascript
import Persist from "@acodeninja/persist";
import FileEngine from "@acodeninja/persist/engine/file";

export class Tag extends Persist.Type.Model {
    static tag = Persist.Type.String.required;
    static description = Persist.Type.String;
    static searchProperties = () => ['tag', 'description'];
    static indexProperties = () => ['tag'];
}

const tag = new Tag({tag: 'documentation', description: 'How to use the persist library'});

FileEngine.find(Tag, {tag: 'documentation'});
// [Tag {tag: 'documentation', description: 'How to use the persist library'}]

FileEngine.search(Tag, 'how to');
// [Tag {tag: 'documentation', description: 'How to use the persist library'}]
```

## Storage

### Filesystem Storage Engine

To store models using the local file system, use the `File` storage engine.

```javascript
import Persist from "@acodeninja/persist";
import FileEngine from "@acodeninja/persist/engine/file";

Persist.addEngine('local', FileEngine, {
  path: '/app/storage',
});

export class Tag extends Persist.Type.Model {
  static tag = Persist.Type.String.required;
}

Persist.getEngine('local', FileEngine).put(new Tag({tag: 'documentation'}));
```

### S3 Storage Engine

To store models using an S3 Bucket, use the `S3` storage engine.

```javascript
import Persist from "@acodeninja/persist";
import S3Engine from "@acodeninja/persist/engine/s3";

Persist.addEngine('remote', S3Engine, {
  bucket: 'test-bucket',
  client: new S3Client(),
});

export class Tag extends Persist.Type.Model {
  static tag = Persist.Type.String.required;
}

Persist.getEngine('remote', S3Engine).put(new Tag({tag: 'documentation'}));
```
