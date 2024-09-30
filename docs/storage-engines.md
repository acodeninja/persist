# Storage Engines

Persist makes several storage engines available for use with the library

## Filesystem Storage Engine

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

await Persist.getEngine('local', FileEngine).put(new Tag({tag: 'documentation'}));
```

## HTTP Storage Engine

To store models using an HTTP server, use the `HTTP` storage engine. When using the `HTTP` engine in the browser, refer to [code quirks](./code-quirks.md#using-http-engine-in-browser).

```javascript
import Persist from "@acodeninja/persist";
import HTTPEngine from "@acodeninja/persist/engine/http";

Persist.addEngine('remote', HTTPEngine, {
    host: 'https://api.example.com',
});

export class Tag extends Persist.Type.Model {
    static tag = Persist.Type.String.required;
}

await Persist.getEngine('remote', HTTPEngine).put(new Tag({tag: 'documentation'}));
```

## S3 Storage Engine

To store models using an S3 Bucket, use the `S3` storage engine. To use the `S3` engine you must also add the `@aws-sdk/client-s3` dependency to your `package.json` file.

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

await Persist.getEngine('remote', S3Engine).put(new Tag({tag: 'documentation'}));
```
