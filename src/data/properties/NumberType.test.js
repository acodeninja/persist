import {describe, expect, test} from '@jest/globals';
import NumberType from './NumberType.js';

describe('NumberType', () => {
    test('NumberType is Number', () => {
        expect(NumberType.toString()).toBe('Number');
    });

    test('NumberType is not required', () => {
        expect(NumberType._required).toBe(false);
    });

    test('NumberType does not have properties', () => {
        expect(NumberType._properties).toBeUndefined();
    });

    test('NumberType does not have items', () => {
        expect(NumberType._items).toBeUndefined();
    });

    test('NumberType is not a resolved type', () => {
        expect(NumberType._resolved).toBe(false);
    });
});

describe('RequiredNumberType', () => {
    test('RequiredNumberType is Number', () => {
        expect(NumberType.required.toString()).toBe('RequiredNumber');
    });

    test('RequiredNumberType is required', () => {
        expect(NumberType.required._required).toBe(true);
    });

    test('RequiredNumberType does not have properties', () => {
        expect(NumberType.required._properties).toBeUndefined();
    });

    test('RequiredNumberType does not have items', () => {
        expect(NumberType.required._items).toBeUndefined();
    });

    test('RequiredNumberType is not a resolved type', () => {
        expect(NumberType.required._resolved).toBe(false);
    });
});
