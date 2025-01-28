import FileStorageEngine from '@acodeninja/persist/engine/storage/file';
import Persist from '@acodeninja/persist';
import fs from 'node:fs/promises';
import test from 'ava';

test('Persist allows adding the FileStorageEngine', t => {
    Persist.addEngine('files', FileStorageEngine, {
        path: '/tmp/fileEngine',
    });

    t.like(Persist._engine.files.FileStorageEngine.configuration, {
        path: '/tmp/fileEngine',
        filesystem: fs,
    });
});

test('Persist allows adding the FileStorageEngine with transactions', t => {
    Persist.addEngine('files', FileStorageEngine, {
        path: '/tmp/fileEngine',
        transactions: true,
    });

    t.like(Persist._engine.files.FileStorageEngine.configuration, {
        path: '/tmp/fileEngine',
        filesystem: fs,
        transactions: true,
    });

    t.is(typeof Persist._engine.files.FileStorageEngine.start, 'function');
});

test('Persist allows retrieving a FileStorageEngine', t => {
    Persist.addEngine('files', FileStorageEngine, {
        path: '/tmp/fileEngine',
    });

    t.like(Persist.getEngine('files', FileStorageEngine).configuration, {
        path: '/tmp/fileEngine',
        filesystem: fs,
    });
});
