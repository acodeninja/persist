import {describe, expect, test} from '@jest/globals';
import ArrayType from './ArrayType.js';
import BooleanType from './BooleanType.js';
import DateType from './DateType.js';
import NumberType from './NumberType.js';
import StringType from './StringType.js';

const typesToTest = [StringType, NumberType, BooleanType, DateType];

describe.each(typesToTest)('ArrayType.of(%s)', (type) => {
    test(`ArrayType.of(${type}) is ArrayOf(${type})`, () => {
        expect(ArrayType.of(type).toString()).toBe(`ArrayOf(${type})`);
    });

    test(`ArrayType.of(${type}) is not required`, () => {
        expect(ArrayType.of(type)._required).toBe(false);
    });

    test(`ArrayType.of(${type}) does not have properties`, () => {
        expect(ArrayType.of(type)._properties).toBeUndefined();
    });

    test(`ArrayType.of(${type}) has items of type String`, () => {
        expect(ArrayType.of(type)._items).toBe(type);
    });

    test(`ArrayType.of(${type}) is not a resolved type`, () => {
        expect(ArrayType.of(type)._resolved).toBe(false);
    });
});

describe.each(typesToTest)('RequiredArrayType.of(%s)', (type) => {
    test(`RequiredArrayType.of(${type}) is RequiredArrayOf(${type})`, () => {
        expect(ArrayType.of(type).required.toString()).toBe(`RequiredArrayOf(${type})`);
    });

    test(`RequiredArrayType.of(${type}) is required`, () => {
        expect(ArrayType.of(type).required._required).toBe(true);
    });

    test(`RequiredArrayType.of(${type}) does not have properties`, () => {
        expect(ArrayType.of(type).required._properties).toBeUndefined();
    });

    test(`RequiredArrayType.of(${type}) has items of type String`, () => {
        expect(ArrayType.of(type).required._items).toBe(type);
    });

    test(`RequiredArrayType.of(${type}) is not a resolved type`, () => {
        expect(ArrayType.of(type).required._resolved).toBe(false);
    });
});
