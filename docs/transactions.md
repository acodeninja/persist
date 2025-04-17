## Transactions

Create transactions to automatically roll back on failure.

```javascript
import Persist from "@acodeninja/persist";
import S3StorageEngine from "@acodeninja/persist/storage/s3";

const connection = Persist.registerConnection('remote', new S3StorageEngine({
    bucket: 'test-bucket',
    client: new S3Client(),
}));

export class Tag extends Persist.Model {
    static tag = Persist.Property.String.required;
}

const transaction = connection.start();

await transaction.put(new Tag({tag: 'documentation'}));
await transaction.commit();
```
