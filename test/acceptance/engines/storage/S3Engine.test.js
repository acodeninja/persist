import {expect, test} from '@jest/globals';
import Persist from '../../../../exports/default.js';
import S3StorageEngine from '../../../../exports/engine/storage/s3.js';

test('Persist allows adding the S3StorageEngine', () => {
    Persist.addEngine('s3', S3StorageEngine, {
        bucket: 'test-bucket',
        prefix: 'test',
    });

    expect(Persist._engine.s3.S3StorageEngine.configuration).toStrictEqual({
        bucket: 'test-bucket',
        prefix: 'test',
    });
});

test('Persist allows adding the S3StorageEngine with transactions', () => {
    Persist.addEngine('s3', S3StorageEngine, {
        bucket: 'test-bucket',
        prefix: 'test',
        transactions: true,
    });

    expect(Persist._engine.s3.S3StorageEngine.configuration).toStrictEqual({
        bucket: 'test-bucket',
        prefix: 'test',
        transactions: true,
    });

    expect(typeof Persist._engine.s3.S3StorageEngine.start).toBe('function');
});

test('Persist allows retrieving a S3StorageEngine', () => {
    Persist.addEngine('s3', S3StorageEngine, {
        bucket: 'test-bucket',
        prefix: 'test',
    });

    expect(Persist.getEngine('s3', S3StorageEngine).configuration).toStrictEqual({
        bucket: 'test-bucket',
        prefix: 'test',
    });
});
