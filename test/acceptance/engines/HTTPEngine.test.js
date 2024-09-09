import HTTPEngine from '@acodeninja/persist/engine/http';
import Persist from '@acodeninja/persist';
import test from 'ava';

test('Persist allows adding the HTTPEngine', t => {
    Persist.addEngine('http', HTTPEngine, {
        host: 'https://example.com',
        prefix: 'test',
    });

    t.like(Persist._engine.http.HTTPEngine._configuration, {
        host: 'https://example.com',
        prefix: 'test',
    });
});

test('Persist allows adding the HTTPEngine with transactions', t => {
    Persist.addEngine('http', HTTPEngine, {
        host: 'https://example.com',
        prefix: 'test',
        transactions: true,
    });

    t.like(Persist._engine.http.HTTPEngine._configuration, {
        host: 'https://example.com',
        prefix: 'test',
        transactions: true,
    });

    t.is(typeof Persist._engine.http.HTTPEngine.start, 'function');
});

test('Persist allows retrieving a HTTPEngine', t => {
    Persist.addEngine('http', HTTPEngine, {
        host: 'https://example.com',
        prefix: 'test',
    });

    t.like(Persist.getEngine('http', HTTPEngine)._configuration, {
        host: 'https://example.com',
        prefix: 'test',
    });
});
