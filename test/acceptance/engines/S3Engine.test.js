import Persist from '@acodeninja/persist';
import S3Engine from '@acodeninja/persist/engine/s3';
import test from 'ava';

test('Persist allows adding the S3Engine', t => {
    Persist.addEngine('s3', S3Engine, {
        bucket: 'test-bucket',
        prefix: 'test',
    });

    t.like(Persist._engine.s3.S3Engine.configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
    });
});

test('Persist allows adding the S3Engine with transactions', t => {
    Persist.addEngine('s3', S3Engine, {
        bucket: 'test-bucket',
        prefix: 'test',
        transactions: true,
    });

    t.like(Persist._engine.s3.S3Engine.configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
        transactions: true,
    });

    t.is(typeof Persist._engine.s3.S3Engine.start, 'function');
});

test('Persist allows retrieving a S3Engine', t => {
    Persist.addEngine('s3', S3Engine, {
        bucket: 'test-bucket',
        prefix: 'test',
    });

    t.like(Persist.getEngine('s3', S3Engine).configuration, {
        bucket: 'test-bucket',
        prefix: 'test',
    });
});
