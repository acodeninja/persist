import Persist from '@acodeninja/persist';
import S3StorageEngine from '@acodeninja/persist/engine/storage/s3';
import test from 'ava';

test('Persist allows adding the S3StorageEngine', t => {
    Persist.addEngine('s3', S3StorageEngine, {
        bucket: 'test-bucket',
        prefix: 'test',
    });

    t.like(Persist._engine.s3.S3StorageEngine.configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
    });
});

test('Persist allows adding the S3StorageEngine with transactions', t => {
    Persist.addEngine('s3', S3StorageEngine, {
        bucket: 'test-bucket',
        prefix: 'test',
        transactions: true,
    });

    t.like(Persist._engine.s3.S3StorageEngine.configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
        transactions: true,
    });

    t.is(typeof Persist._engine.s3.S3StorageEngine.start, 'function');
});

test('Persist allows retrieving a S3StorageEngine', t => {
    Persist.addEngine('s3', S3StorageEngine, {
        bucket: 'test-bucket',
        prefix: 'test',
    });

    t.like(Persist.getEngine('s3', S3StorageEngine).configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
    });
});
