import {describe, expect, test} from '@jest/globals';
import StorageEngine from './StorageEngine.js';
import Type from '../type/index.js';

/**
 * @class EmptyModel
 * @extends Type.Model
 */
class EmptyModel extends Type.Model {
}

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
                EmptyModel: EmptyModel,
            });
        });

        test('the given configuration is set', () => {
            expect(engine.configuration).toStrictEqual({test: true});
        });
    });
});
