import {describe, expect, test} from '@jest/globals';
import Type from './Type.js';

describe('Type', () => {
    test('Type is of type Type', () => {
        expect(Type.toString()).toBe('Type');
    });

    test('Type is not required', () => {
        expect(Type._required).toBe(false);
    });

    test('Type does not have properties', () => {
        expect(Type._properties).toBeUndefined();
    });

    test('Type does not have items', () => {
        expect(Type._items).toBeUndefined();
    });

    test('Type is not a resolved type', () => {
        expect(Type._resolved).toBe(false);
    });
});

describe('RequiredType', () => {
    test('RequiredType is of Required type', () => {
        expect(Type.required.toString()).toBe('RequiredType');
    });

    test('RequiredType is required', () => {
        expect(Type.required._required).toBe(true);
    });

    test('RequiredType does not have properties', () => {
        expect(Type.required._properties).toBeUndefined();
    });

    test('RequiredType does not have items', () => {
        expect(Type.required._items).toBeUndefined();
    });

    test('RequiredType is not a resolved type', () => {
        expect(Type.required._resolved).toBe(false);
    });
});
