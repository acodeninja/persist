import {describe, expect, test} from '@jest/globals';
import BooleanType from './BooleanType.js';

describe('BooleanType', () => {
    test('BooleanType is Boolean', () => {
        expect(BooleanType.toString()).toBe('Boolean');
    });

    test('BooleanType is not required', () => {
        expect(BooleanType._required).toBe(false);
    });

    test('BooleanType does not have properties', () => {
        expect(BooleanType._properties).toBe(undefined);
    });

    test('BooleanType does not have items', () => {
        expect(BooleanType._items).toBe(undefined);
    });

    test('BooleanType is not a resolved type', () => {
        expect(BooleanType._resolved).toBe(false);
    });
});

describe('RequiredBooleanType', () => {
    test('RequiredBooleanType is Boolean', () => {
        expect(BooleanType.required.toString()).toBe('RequiredBoolean');
    });

    test('RequiredBooleanType is required', () => {
        expect(BooleanType.required._required).toBe(true);
    });

    test('RequiredBooleanType does not have properties', () => {
        expect(BooleanType.required._properties).toBe(undefined);
    });

    test('RequiredBooleanType does not have items', () => {
        expect(BooleanType.required._items).toBe(undefined);
    });

    test('RequiredBooleanType is not a resolved type', () => {
        expect(BooleanType.required._resolved).toBe(false);
    });
});
