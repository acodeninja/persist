import {expect, test} from '@jest/globals';
import FileStorageEngine from '../../../../exports/engine/storage/file.js';
import Persist from '../../../../exports/default.js';
import fs from 'node:fs/promises';

test('Persist allows adding the FileStorageEngine', () => {
    Persist.addEngine('files', FileStorageEngine, {
        path: '/tmp/fileEngine',
    });

    expect(Persist._engine.files.FileStorageEngine.configuration).toStrictEqual({
        path: '/tmp/fileEngine',
        filesystem: fs,
    });
});

test('Persist allows adding the FileStorageEngine with transactions', () => {
    Persist.addEngine('files', FileStorageEngine, {
        path: '/tmp/fileEngine',
        transactions: true,
    });

    expect(Persist._engine.files.FileStorageEngine.configuration).toStrictEqual({
        path: '/tmp/fileEngine',
        filesystem: fs,
        transactions: true,
    });

    expect(typeof Persist._engine.files.FileStorageEngine.start).toBe('function');
});

test('Persist allows retrieving a FileStorageEngine', () => {
    Persist.addEngine('files', FileStorageEngine, {
        path: '/tmp/fileEngine',
    });

    expect(Persist.getEngine('files', FileStorageEngine).configuration).toStrictEqual({
        path: '/tmp/fileEngine',
        filesystem: fs,
    });
});
