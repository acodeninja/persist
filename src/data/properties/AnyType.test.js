import {describe, expect, test} from '@jest/globals';
import AnyType from './AnyType.js';
import BooleanType from './BooleanType.js';
import DateType from './DateType.js';
import NumberType from './NumberType.js';
import StringType from './StringType.js';

const typesToTest = [[StringType, NumberType], [NumberType, BooleanType], [BooleanType, DateType], [DateType, StringType]];

describe.each(typesToTest)('AnyType.of(%s|%s)', (typeA, typeB) => {
    test(`AnyType.of(${typeA}, ${typeB}) is AnyOf(${typeA}|${typeB})`, () => {
        expect(AnyType.of(typeA, typeB).toString()).toBe(`AnyOf(${typeA}|${typeB})`);
    });

    test(`AnyType.of(${typeA}) is not required`, () => {
        expect(AnyType.of(typeA, typeB)._required).toBe(false);
    });

    test(`AnyType.of(${typeA}) has the valid types`, () => {
        expect(AnyType.of(typeA, typeB)._items).toStrictEqual([typeA, typeB]);
    });

    test(`AnyType.of(${typeA}) does not have properties`, () => {
        expect(AnyType.of(typeA, typeB)._properties).toBeUndefined();
    });

    test(`AnyType.of(${typeA}) is not a resolved type`, () => {
        expect(AnyType.of(typeA, typeB)._resolved).toBe(false);
    });
});

describe.each(typesToTest)('RequiredAnyType.of(%s|%s)', (typeA, typeB) => {
    test(`RequiredAnyType.of(${typeA}, ${typeB}) is RequiredAnyOf(${typeA}|${typeB})`, () => {
        expect(AnyType.of(typeA, typeB).required.toString()).toBe(`RequiredAnyOf(${typeA}|${typeB})`);
    });

    test(`RequiredAnyType.of(${typeA}, ${typeB}) is required`, () => {
        expect(AnyType.of(typeA, typeB).required._required).toBe(true);
    });

    test(`AnyType.of(${typeA}) has the valid types`, () => {
        expect(AnyType.of(typeA, typeB)._items).toStrictEqual([typeA, typeB]);
    });

    test(`RequiredAnyType.of(${typeA}, ${typeB}) does not have properties`, () => {
        expect(AnyType.of(typeA, typeB).required._properties).toBeUndefined();
    });

    test(`RequiredAnyType.of(${typeA}, ${typeB}) is not a resolved typeA`, () => {
        expect(AnyType.of(typeA, typeB).required._resolved).toBe(false);
    });
});
