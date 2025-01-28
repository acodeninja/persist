## Transactions

Create transactions to automatically roll back on failure.

```javascript
import Persist from "@acodeninja/persist";
import S3StorageEngine from "@acodeninja/persist/engine/storage/s3";

Persist.addEngine('remote', S3StorageEngine, {
    bucket: 'test-bucket',
    client: new S3Client(),
    transactions: true,
});

export class Tag extends Persist.Type.Model {
    static tag = Persist.Type.String.required;
}

const transaction = Persist.getEngine('remote', S3StorageEngine).start();

await transaction.put(new Tag({tag: 'documentation'}));
await transaction.commit();
```
