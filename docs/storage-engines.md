# Storage Engines

Persist makes several storage engines available for use with the library

## Filesystem Storage StorageEngine

To store models using the local file system, use the `File` storage engine.

```javascript
import Persist from "@acodeninja/persist";
import FileStorageEngine from "@acodeninja/persist/engine/storage/file";

Persist.addEngine('local', FileStorageEngine, {
    path: '/app/storage',
});

export class Tag extends Persist.Type.Model {
    static tag = Persist.Type.String.required;
}

await Persist.getEngine('local', FileStorageEngine).put(new Tag({tag: 'documentation'}));
```

## HTTP Storage StorageEngine

To store models using an HTTP server, use the `HTTP` storage engine. When using the `HTTP` engine in the browser, refer to [code quirks](./code-quirks.md#using-http-engine-in-browser).

```javascript
import Persist from "@acodeninja/persist";
import HTTPStorageEngine from "@acodeninja/persist/engine/storage/http";

Persist.addEngine('remote', HTTPStorageEngine, {
    host: 'https://api.example.com',
});

export class Tag extends Persist.Type.Model {
    static tag = Persist.Type.String.required;
}

await Persist.getEngine('remote', HTTPStorageEngine).put(new Tag({tag: 'documentation'}));
```

## S3 Storage StorageEngine

To store models using an S3 Bucket, use the `S3` storage engine. To use the `S3` engine you must also add the `@aws-sdk/client-s3` dependency to your `package.json` file.

```javascript
import Persist from "@acodeninja/persist";
import S3StorageEngine from "@acodeninja/persist/engine/storage/s3";

Persist.addEngine('remote', S3StorageEngine, {
    bucket: 'test-bucket',
    client: new S3Client(),
});

export class Tag extends Persist.Type.Model {
    static tag = Persist.Type.String.required;
}

await Persist.getEngine('remote', S3StorageEngine).put(new Tag({tag: 'documentation'}));
```
