import {expect, test} from '@jest/globals';
import Persist from './Persist.js';
import Type from './type/index.js';

class TestEngine {
    static configure(configuration = {}) {
        class ConfiguredTestEngine extends TestEngine {
            static configuration = configuration;
        }

        return ConfiguredTestEngine;
    }
}

test('includes Type', () => {
    expect(Persist.Type).toBe(Type);
});

test('.addEngine(group, engine, configuration) adds and configures an engine', () => {
    Persist.addEngine('one', TestEngine, {test: true});

    expect(Persist._engine.one.TestEngine.configuration).toStrictEqual({test: true});
});

test('.getEngine(group, engine) retrieves an engine', () => {
    Persist.addEngine('one', TestEngine, {test: true});

    expect(Persist.getEngine('one', TestEngine).configuration).toStrictEqual({test: true});
});

test('.getEngine(group, nonEngine) retrieves no engines', () => {
    expect(Persist.getEngine('two', TestEngine)).toBe(null);
});
