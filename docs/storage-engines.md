# Storage Engines

Persist makes several storage engines available for use with the library

## S3 Storage StorageEngine

To store models using an S3 Bucket, use the `S3` storage engine. To use the `S3` engine you must also add the `@aws-sdk/client-s3` dependency to your `package.json` file.

```javascript
import Persist from "@acodeninja/persist";
import {S3Client} from "@aws-sdk/client-s3";
import S3StorageEngine from "@acodeninja/persist/storage/s3";

const connection = Persist.registerConnection('remote', new S3StorageEngine({
    bucket: 'test-bucket',
    client: new S3Client(),
}));

export class Tag extends Persist.Model {
    static tag = Persist.Property.String.required;
}

await connection.put(new Tag({tag: 'documentation'}));
```

## HTTP Storage StorageEngine

To store models using an HTTP server, use the `HTTP` storage engine. When using the `HTTP` engine in the browser, refer to [code quirks](./code-quirks.md#using-http-engine-in-browser).

```javascript
import Persist from "@acodeninja/persist";
import HTTPStorageEngine from "@acodeninja/persist/storage/http";

const connection = Persist.registerConnection('remote', new HTTPStorageEngine({
    baseUrl: 'https://api.example.com',
}));

export class Tag extends Persist.Model {
    static tag = Persist.Property.String.required;
}

await connection.put(new Tag({tag: 'documentation'}));
```

A generic Open API specification for an HTTP server integration with `Persist` can be found [here](./http.openapi.yml).
