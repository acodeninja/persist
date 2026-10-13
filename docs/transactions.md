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

const transaction = connection.transaction();

await transaction.put(new Tag({tag: 'documentation'}));
await transaction.commit();
```

Nothing reaches storage until `commit()`. Reads inside a transaction go straight
to the engine, so they see the data as it was before the transaction started.

### Write ordering

Both `put` and `delete` order their writes so that a reader never sees an index
entry without the model it points at:

- `put` writes the model, then the indexes that list it. An index that has not
  caught up hides a model that is stored, so it reads as missing.
- `delete` writes the indexes, then deletes the model. A model nothing lists is
  unreachable, so it costs storage.

The inverse of either leaves an index pointing at a model that is not there,
which fails every read of that id.
