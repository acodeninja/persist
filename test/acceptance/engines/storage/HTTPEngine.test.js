import {expect, test} from '@jest/globals';
import HTTPStorageEngine from '../../../../exports/engine/storage/http.js';
import Persist from '../../../../exports/default.js';

test('Persist allows adding the HTTPStorageEngine', () => {
    Persist.addEngine('http', HTTPStorageEngine, {
        host: 'https://example.com',
        prefix: 'test',
    });

    expect(Persist._engine.http.HTTPStorageEngine.configuration).toStrictEqual({
        host: 'https://example.com',
        prefix: 'test',
        fetchOptions: {
            headers: {
                Accept: 'application/json',
            },
        },
    });
});

test('Persist allows adding the HTTPStorageEngine with transactions', () => {
    Persist.addEngine('http', HTTPStorageEngine, {
        host: 'https://example.com',
        prefix: 'test',
        transactions: true,
    });

    expect(Persist._engine.http.HTTPStorageEngine.configuration).toStrictEqual({
        host: 'https://example.com',
        prefix: 'test',
        transactions: true,
        fetchOptions: {
            headers: {
                Accept: 'application/json',
            },
        },
    });

    expect(typeof Persist._engine.http.HTTPStorageEngine.start).toBe('function');
});

test('Persist allows retrieving a HTTPStorageEngine', () => {
    Persist.addEngine('http', HTTPStorageEngine, {
        host: 'https://example.com',
        prefix: 'test',
    });

    expect(Persist.getEngine('http', HTTPStorageEngine).configuration).toStrictEqual({
        host: 'https://example.com',
        prefix: 'test',
        fetchOptions: {
            headers: {
                Accept: 'application/json',
            },
        },
    });
});
