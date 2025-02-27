import StorageEngine, {
    MethodNotImplementedStorageEngineError,
    ModelNotRegisteredStorageEngineError,
} from './StorageEngine.js';
import {describe, expect, test} from '@jest/globals';
import {EmptyModel} from '../../test/fixtures/Model.js';
import Type from '../type/index.js';

describe('UnimplementedStorageEngine', () => {
    class UnimplementedStorageEngine extends StorageEngine {
    }

    const storageEngine = new UnimplementedStorageEngine({}, [EmptyModel]);

    describe.each([
        '_getModel',
        '_putModel',
        '_deleteModel',
        '_getIndex',
        '_putIndex',
        '_getSearchIndex',
        '_getSearchIndexCompiled',
        '_putSearchIndex',
    ])('when the storage engine does not implement %s', (method) => {
        test(`a ${method} is not implemented error is thrown`, async () => {
            await expect(() => storageEngine[method](new EmptyModel()))
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

        test('no models are registered', () => {
            expect(engine.models).toStrictEqual({});
        });

        test('no configuration is set', () => {
            expect(engine.configuration).toStrictEqual({});
        });
    });

    describe('when only a configuration is given', () => {
        const engine = new StorageEngine({test: true});

        test('no models are registered', () => {
            expect(engine.models).toStrictEqual({});
        });

        test('the given configuration is set', () => {
            expect(engine.configuration).toStrictEqual({test: true});
        });
    });

    describe('when both models and configuration are given', () => {
        const engine = new StorageEngine({test: true}, [EmptyModel]);

        test('the model is registered', () => {
            expect(engine.models).toStrictEqual({
                EmptyModel,
            });
        });

        test('the given configuration is set', () => {
            expect(engine.configuration).toStrictEqual({test: true});
        });
    });
});

describe('storageEngine.getLinksFor(model)', () => {
    describe('when there are no linked models', () => {
        const engine = new StorageEngine({}, [EmptyModel]);

        test('no models are returned', () => {
            expect(engine.getLinksFor(EmptyModel)).toStrictEqual({});
        });
    });

    describe('when the given model has a single directional link to another model', () => {
        /**
         * @class MainModel
         * @extends Type.Model
         */
        class MainModel extends Type.Model {
            static linked = () => LinkedModel;
        }

        /**
         * @class LinkedModel
         * @extends Type.Model
         */
        class LinkedModel extends Type.Model {
        }

        const engine = new StorageEngine({}, [MainModel, LinkedModel]);

        test('the linked model is returned', () => {
            expect(engine.getLinksFor(MainModel)).toStrictEqual({MainModel: {linked: LinkedModel}});
        });

        describe('and the link is not defined using an arrow function', () => {
            /**
             * @class LinkedModel
             * @extends Type.Model
             */
            class LinkedModel extends Type.Model {
            }

            /**
             * @class MainModel
             * @extends Type.Model
             */
            class MainModel extends Type.Model {
                static linked = LinkedModel;
            }

            const engine = new StorageEngine({}, [MainModel, LinkedModel]);

            test('the linked model is returned', () => {
                expect(engine.getLinksFor(MainModel)).toStrictEqual({MainModel: {linked: LinkedModel}});
            });
        });
    });

    describe('when the given model has a bi-directional link to another model', () => {
        /**
         * @class MainModel
         * @extends Type.Model
         */
        class MainModel extends Type.Model {
            static linked = () => LinkedModel;
        }

        /**
         * @class LinkedModel
         * @extends Type.Model
         */
        class LinkedModel extends Type.Model {
            static linked = () => MainModel;
        }

        const engine = new StorageEngine({}, [MainModel, LinkedModel]);

        test('both linked models are returned', () => {
            expect(engine.getLinksFor(MainModel)).toStrictEqual({
                MainModel: {linked: LinkedModel},
                LinkedModel: {linked: MainModel},
            });
        });
    });

    describe('when there are registered models that are linked but not related', () => {
        /**
         * @class MainModel
         * @extends Type.Model
         */
        class MainModel extends Type.Model {
            static linked = () => LinkedModel;
        }

        /**
         * @class LinkedModel
         * @extends Type.Model
         */
        class LinkedModel extends Type.Model {
            static linked = () => MainModel;
        }

        /**
         * @class SecondaryModel
         * @extends Type.Model
         */
        class SecondaryModel extends Type.Model {
            static linked = () => SecondaryLinkedModel;
        }

        /**
         * @class SecondaryLinkedModel
         * @extends Type.Model
         */
        class SecondaryLinkedModel extends Type.Model {
            static linked = () => SecondaryModel;
        }

        const engine = new StorageEngine({}, [MainModel, LinkedModel, SecondaryModel, SecondaryLinkedModel]);

        test('both linked models are returned', () => {
            expect(engine.getLinksFor(MainModel)).toStrictEqual({
                MainModel: {linked: LinkedModel},
                LinkedModel: {linked: MainModel},
            });
        });
    });
});

describe('storageEngine.getModelConstructorFromId(modelId)', () => {
    describe('when the given model is registered', () => {
        const storageEngine = new StorageEngine({}, [EmptyModel]);

        test('the model is returned', () => {
            const model = new EmptyModel();

            expect(storageEngine.getModelConstructorFromId(model.id)).toBe(EmptyModel);
        });
    });

    describe('when the given model is not registered', () => {
        const storageEngine = new StorageEngine({}, []);

        test('an error indicating the model is not registered is thrown', () => {
            const model = new EmptyModel();

            expect(() => storageEngine.getModelConstructorFromId(model.id))
                .toThrowError({
                    instanceOf: ModelNotRegisteredStorageEngineError,
                    message: 'The model EmptyModel is not registered in the storage engine StorageEngine',
                });
        });
    });
});
