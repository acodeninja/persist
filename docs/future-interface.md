# Persist future interface

```javascript
import Persist from "@acodeninja/persist";
import S3StorageEngine from "@acodeninja/persist/engine/storage/s3";
class Person extends Persist.Model {
    static {
        this.withName('Person');
        this.withIndex(['string']);
        this.withSearch(['string']);

        this.name = Persist.Property.String.required;
    }
}

const connection = Persist.register('main', {
    storage: new S3StorageEngine({
        client: new S3Client(),
    }),
});

// to get the connection `Persist.get('main')`

const person = new Person({name: 'Joe Bloggs'});

await connection.put(person);

await connection.delete(person);
```
