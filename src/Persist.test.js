import Persist from './Persist.js';
import Type from './type/index.js';
import test from 'ava';

class TestEngine {
    static configure(configuration = {}) {
        class ConfiguredTestEngine extends TestEngine {
            static configuration = configuration;
        }

        return ConfiguredTestEngine;
    }
}

test('includes Type', t => {
    t.is(Persist.Type, Type);
});

test('.addEngine(group, engine, configuration) adds and configures an engine', t => {
    Persist.addEngine('one', TestEngine, {test: true});

    t.like(Persist._engine.one.TestEngine.configuration, {test: true});
});

test('.getEngine(group, engine) retrieves an engine', t => {
    Persist.addEngine('one', TestEngine, {test: true});

    t.like(Persist.getEngine('one', TestEngine).configuration, {test: true});
});

test('.getEngine(group, nonEngine) retrieves no engines', t => {
    t.is(Persist.getEngine('two', TestEngine), null);
});
