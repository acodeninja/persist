import {describe, expect, test} from '@jest/globals';
import CustomType from './CustomType.js';

const validSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        string: {type: 'string'},
        number: {type: 'number'},
        boolean: {type: 'boolean'},
    },
};

describe('CustomType', () => {
    test('CustomType.of(validSchema) is Custom', () => {
        expect(CustomType.of(validSchema).toString()).toBe('Custom');
    });

    test('CustomType.of(validSchema) is not required', () => {
        expect(CustomType.of(validSchema)._required).toBe(false);
    });

    test('CustomType.of(validSchema) does not have properties', () => {
        expect(CustomType.of(validSchema)._properties).toBeUndefined();
    });

    test('CustomType.of(validSchema) has items of type String', () => {
        expect(CustomType.of(validSchema)._items).toBeUndefined();
    });

    test('CustomType.of(validSchema) is not a resolved type', () => {
        expect(CustomType.of(validSchema)._resolved).toBe(false);
    });

    describe('with invalid schema', () => {
        const invalidSchema = {
            additional: false,
            properties: {
                string: {type: 'not'},
                number: {type: 'a'},
                boolean: {type: 'real'},
            },
            type: 'schema',
        };

        test('CustomType.of(invalidSchema) throws an invalid schema error', () => {
            expect(() => {
                CustomType.of(invalidSchema);
            }).toThrowError({
                instanceOf: Error,
                message: 'schema is invalid: data/properties/string/type must be equal to one of the allowed values, data/properties/string/type must be array, data/properties/string/type must match a schema in anyOf',
            });
        });
    });
});

describe('RequiredCustomType', () => {
    test('RequiredCustomType.of(validSchema) is RequiredCustom', () => {
        expect(CustomType.of(validSchema).required.toString()).toBe('RequiredCustom');
    });

    test('RequiredCustomType.of(validSchema) is required', () => {
        expect(CustomType.of(validSchema).required._required).toBe(true);
    });

    test('RequiredCustomType.of(validSchema) does not have properties', () => {
        expect(CustomType.of(validSchema).required._properties).toBeUndefined();
    });

    test('RequiredCustomType.of(validSchema) has items of type String', () => {
        expect(CustomType.of(validSchema).required._items).toBeUndefined();
    });

    test('RequiredCustomType.of(validSchema) is not a resolved type', () => {
        expect(CustomType.of(validSchema).required._resolved).toBe(false);
    });
});
