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

### Caching and stale reads

The engine stamps a `Cache-Control` header on every object it writes (models,
find indexes, and search indexes). By default this is `no-cache`, which lets a
browser store the object body but requires it to revalidate against S3 (a
conditional GET on the ETag) before reuse — S3 answers `304 Not Modified` when
nothing changed, or `200` with fresh data when it did.

This matters in the browser: without a stored cache directive, browsers apply
*heuristic caching* to S3 objects and can serve a stale `_index.json` shortly
after a write — showing missing new records or lingering deleted ones until a
hard reload. Stamping `no-cache` on writes avoids this, and because the directive
travels on the object itself, no read-side or client configuration is needed.

If you knowingly serve immutable data and want to opt out (or use a different
directive), set `cacheControl` on the engine configuration:

```javascript
const connection = Persist.registerConnection('remote', new S3StorageEngine({
    bucket: 'test-bucket',
    client: new S3Client(),
    cacheControl: 'max-age=31536000, immutable',
}));
```

> Objects written before this behaviour existed keep serving without the header
> until they are rewritten. Indexes fix themselves on the next mutation; to update
> an entire bucket at once you can run:
> `aws s3 cp s3://bucket s3://bucket --recursive --metadata-directive REPLACE --cache-control no-cache`

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
