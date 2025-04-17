# @acodeninja/persist

A JSON based data modelling and persistence library with alternate storage mechanisms, designed with static site generation in mind.

![NPM Version](https://img.shields.io/npm/v/%40acodeninja%2Fpersist)
![NPM Unpacked Size](https://img.shields.io/npm/unpacked-size/%40acodeninja%2Fpersist)
![GitHub top language](https://img.shields.io/github/languages/top/acodeninja/persist)
![NPM Downloads](https://img.shields.io/npm/dw/%40acodeninja%2Fpersist)

[![DeepSource](https://app.deepsource.com/gh/acodeninja/persist.svg/?label=active+issues&show_trend=true&token=Vd8_PJuRwwoq4_uBJ0_ymc06)](https://app.deepsource.com/gh/acodeninja/persist/)
[![DeepSource](https://app.deepsource.com/gh/acodeninja/persist.svg/?label=code+coverage&show_trend=true&token=Vd8_PJuRwwoq4_uBJ0_ymc06)](https://app.deepsource.com/gh/acodeninja/persist/)
![CodeRabbit PR Reviews](https://img.shields.io/coderabbit/prs/github/acodeninja/persist?utm_source=oss&utm_medium=github&utm_campaign=acodeninja%2Fpersist&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)

## Features

- Data modelling with relationships
- Data validation
- Data queries and fuzzy search
- Store data using AWS S3 or HTTP APIs

## Terms

`model`
: Defines the shape of an entity's data within your application.

`property`
: Analogous to a data type, allows defining the type of properties associated with a `model`.

`connection`
: Abstraction layer that establishes a connection to the configured storage engine and supports CRUD and query functionality.

`engine`
: An engine allows a connection to send instructions to a given service, it may support anything from a RESTFul HTTP API to a cloud service like S3 or DynamoDB.

## Usage

### Models

```javascript
import Persist from '@acodeninja/persist';

class Person extends Persist.Model {
    static {
        this.name = Persist.Property.String.required;
        this.dateOfBirth = Persist.Property.Date.required;
        this.height = Persist.Property.Number.required;
        this.isStudent = Persist.Property.Boolean.required;
    }
}
```

### Storage

```javascript
import Persist from '@acodeninja/persist';
import {S3Client} from "@aws-sdk/client-s3";
import S3StorageEngine from '@acodeninja/persist/storage/s3';

const engine = new S3StorageEngine({
    bucket: 'person-storage',
    client: new S3Client(),
});

const connection = Persist.registerConnection('people', engine, [Person]);

const person = new Person({
    name: 'Joe Bloggs',
    dateOfBirth: new Date('1993-04-02T00:00:00.000Z'),
    height: 1.85,
    isStudent: true,
});

await connection.put(person);
```

## Find out more

- [Defining Models](./docs/defining-models.md)
- [Model Property Types](./docs/model-properties.md)
- [Models as Properties](./docs/models-as-properties.md)
- [Structured Queries](./docs/structured-queries.md)
- [Search Queries](./docs/search-queries.md)
- [Storage Engines](./docs/storage-engines.md)
- [Transactions](./docs/transactions.md)
- [Quirks](./docs/code-quirks.md)
