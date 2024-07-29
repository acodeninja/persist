import Persist from './default.js';
import test from 'ava';

test('default exports Persist class', async t => {
    const imported = await import('./default.js');

    t.is(imported.default, Persist);
});
