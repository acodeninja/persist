import {describe, expect, test} from '@jest/globals';
import StringType from './StringType.js';

describe('StringType', () => {
    test('StringType is String', () => {
        expect(StringType.toString()).toBe('String');
    });

    test('StringType is not required', () => {
        expect(StringType._required).toBe(false);
    });

    test('StringType does not have properties', () => {
        expect(StringType._properties).toBeUndefined();
    });

    test('StringType does not have items', () => {
        expect(StringType._items).toBeUndefined();
    });

    test('StringType is not a resolved type', () => {
        expect(StringType._resolved).toBe(false);
    });
});

describe('RequiredStringType', () => {
    test('RequiredStringType is RequiredString', () => {
        expect(StringType.required.toString()).toBe('RequiredString');
    });

    test('RequiredStringType is required', () => {
        expect(StringType.required._required).toBe(true);
    });

    test('RequiredStringType does not have properties', () => {
        expect(StringType.required._properties).toBeUndefined();
    });

    test('RequiredStringType does not have items', () => {
        expect(StringType.required._items).toBeUndefined();
    });

    test('RequiredStringType is not a resolved type', () => {
        expect(StringType.required._resolved).toBe(false);
    });
});
