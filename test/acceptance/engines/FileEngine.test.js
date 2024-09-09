import FileEngine from '@acodeninja/persist/engine/file';
import Persist from '@acodeninja/persist';
import fs from 'node:fs/promises';
import test from 'ava';

test('Persist allows adding the FileEngine', t => {
    Persist.addEngine('files', FileEngine, {
        path: '/tmp/fileEngine',
    });

    t.like(Persist._engine.files.FileEngine._configuration, {
        path: '/tmp/fileEngine',
        filesystem: fs,
    });
});

test('Persist allows adding the FileEngine with transactions', t => {
    Persist.addEngine('files', FileEngine, {
        path: '/tmp/fileEngine',
        transactions: true,
    });

    t.like(Persist._engine.files.FileEngine._configuration, {
        path: '/tmp/fileEngine',
        filesystem: fs,
        transactions: true,
    });

    t.is(typeof Persist._engine.files.FileEngine.start, 'function');
});

test('Persist allows retrieving a FileEngine', t => {
    Persist.addEngine('files', FileEngine, {
        path: '/tmp/fileEngine',
    });

    t.like(Persist.getEngine('files', FileEngine)._configuration, {
        path: '/tmp/fileEngine',
        filesystem: fs,
    });
});
