import {expect, test} from '@jest/globals';
import Connection from './Connection.js';
import Persist from './Persist.js';
import Property from './data/Property.js';
import {TestStorageEngine} from '../test/fixtures/Engine.js';

test('includes Property', () => {
    expect(Persist.Property).toBe(Property);
});

test('.getConnection(name) retrieves a registered connection', () => {
    const engine = new TestStorageEngine();
    Persist.registerConnection('one', engine);

    expect(Persist.getConnection('one')).toBeInstanceOf(Connection);
});

test('.getConnection(name) retrieves no engines', () => {
    expect(Persist.getConnection('two')).toBeUndefined();
});
