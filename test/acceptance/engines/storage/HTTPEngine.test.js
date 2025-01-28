import HTTPStorageEngine from '@acodeninja/persist/engine/storage/http';
import Persist from '@acodeninja/persist';
import test from 'ava';

test('Persist allows adding the HTTPStorageEngine', t => {
    Persist.addEngine('http', HTTPStorageEngine, {
        host: 'https://example.com',
        prefix: 'test',
    });

    t.like(Persist._engine.http.HTTPStorageEngine.configuration, {
        host: 'https://example.com',
        prefix: 'test',
    });
});

test('Persist allows adding the HTTPStorageEngine with transactions', t => {
    Persist.addEngine('http', HTTPStorageEngine, {
        host: 'https://example.com',
        prefix: 'test',
        transactions: true,
    });

    t.like(Persist._engine.http.HTTPStorageEngine.configuration, {
        host: 'https://example.com',
        prefix: 'test',
        transactions: true,
    });

    t.is(typeof Persist._engine.http.HTTPStorageEngine.start, 'function');
});

test('Persist allows retrieving a HTTPStorageEngine', t => {
    Persist.addEngine('http', HTTPStorageEngine, {
        host: 'https://example.com',
        prefix: 'test',
    });

    t.like(Persist.getEngine('http', HTTPStorageEngine).configuration, {
        host: 'https://example.com',
        prefix: 'test',
    });
});
