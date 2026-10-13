import StorageEngine, {
    CreateTransactionalStorageEngine,
    MethodNotImplementedStorageEngineError,
} from './StorageEngine.js';
import {describe, expect, test} from '@jest/globals';
import {SimpleModel} from '../../../test/fixtures/Model.js';

describe('UnimplementedStorageEngine', () => {
    class UnimplementedStorageEngine extends StorageEngine {
    }

    const storageEngine = new UnimplementedStorageEngine({}, [SimpleModel]);

    describe.each([
        'getModel',
        'putModel',
        'deleteModel',
        'getIndex',
        'putIndex',
        'getSearchIndex',
        'putSearchIndex',
    ])('when the storage engine does not implement %s', (method) => {
        test(`a ${method} is not implemented error is thrown`, async () => {
            await expect(storageEngine[method](new SimpleModel()))
                .rejects.toThrow({
                    instanceOf: MethodNotImplementedStorageEngineError,
                    message: `The method ${method} is not implemented in the storage engine UnimplementedStorageEngine`,
                });
        });
    });
});

describe('new StorageEngine', () => {
    describe('when no arguments are given', () => {
        const engine = new StorageEngine();

        test('no configuration is set', () => {
            expect(engine.configuration).toStrictEqual({});
        });
    });

    describe('when a configuration is given', () => {
        const engine = new StorageEngine({test: true});

        test('the given configuration is set', () => {
            expect(engine.configuration).toStrictEqual({test: true});
        });
    });
});

describe('CreateTransactionalStorageEngine', () => {
    // Mirrors the shipped engines: methods on the prototype, reading state from a
    // private member. The test engine assigns its methods as own properties, so
    // it cannot show up a receiver that is not the engine itself.
    class PrivateMemberStorageEngine extends StorageEngine {
        #prefix;

        constructor(configuration) {
            super(configuration);
            this.#prefix = configuration.prefix;
        }

        #pathFor(name) {
            return `${this.#prefix}/${name}`;
        }

        getIndex(modelConstructor) {
            return Promise.resolve({path: this.#pathFor(modelConstructor.name)});
        }

        putIndex(_modelConstructor, _index) {
            return Promise.reject(new Error('putIndex must be queued, not called'));
        }
    }

    describe('when reading through the transaction', () => {
        const engine = new PrivateMemberStorageEngine({prefix: 'data'});
        const transactionalEngine = CreateTransactionalStorageEngine([], engine);

        test('the engine reads with itself as the receiver', async () => {
            await expect(transactionalEngine.getIndex(SimpleModel))
                .resolves.toStrictEqual({path: 'data/SimpleModel'});
        });

        test('the engine class is reported unwrapped', () => {
            expect(transactionalEngine.constructor.name).toBe('PrivateMemberStorageEngine');
        });

        test('the engine is still an instance of its own class', () => {
            expect(transactionalEngine).toBeInstanceOf(PrivateMemberStorageEngine);
        });

        test('properties that are not methods pass through', () => {
            expect(transactionalEngine.configuration).toStrictEqual({prefix: 'data'});
        });
    });

    describe.each([
        ['putModel', [{id: 'SimpleModel/000000000000'}]],
        ['deleteModel', ['SimpleModel/000000000000']],
        ['putIndex', [SimpleModel, {}]],
        ['putSearchIndex', [SimpleModel, {}]],
    ])('when calling %s through the transaction', (method, args) => {
        const operations = [];
        const engine = new PrivateMemberStorageEngine({prefix: 'data'});
        const transactionalEngine = CreateTransactionalStorageEngine(operations, engine);

        test('the operation is queued instead of performed', async () => {
            await expect(transactionalEngine[method](...args)).resolves.toBeUndefined();

            expect(operations).toStrictEqual([expect.objectContaining({method, args})]);
        });
    });
});
