import StorageEngine, {MethodNotImplementedStorageEngineError} from './StorageEngine.js';
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
                .rejects.toThrowError({
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
