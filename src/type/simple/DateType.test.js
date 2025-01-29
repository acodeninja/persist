import {describe, expect, test} from '@jest/globals';
import DateType from './DateType.js';

describe('DateType', () => {
    test('DateType is Date', () => {
        expect(DateType.toString()).toBe('Date');
    });

    test('DateType.isDate(not-a-date) returns false', () => {
        expect(DateType.isDate('not-a-date')).toBe(false);
    });

    test('DateType.isDate(date) returns true', () => {
        expect(DateType.isDate(new Date())).toBe(true);
    });

    test('DateType.isDate(date-string) returns true', () => {
        expect(DateType.isDate('2024-09-21T09:25:34.595Z')).toBe(true);
    });

    test('DateType is not required', () => {
        expect(DateType._required).toBe(false);
    });

    test('DateType does not have properties', () => {
        expect(DateType._properties).toBeUndefined();
    });

    test('DateType does not have items', () => {
        expect(DateType._items).toBeUndefined();
    });

    test('DateType is not a resolved type', () => {
        expect(DateType._resolved).toBe(false);
    });

});

describe('RequiredDateType', () => {
    test('RequiredDateType is RequiredDate', () => {
        expect(DateType.required.toString()).toBe('RequiredDate');
    });

    test('RequiredDateType is required', () => {
        expect(DateType.required._required).toBe(true);
    });

    test('RequiredDateType does not have properties', () => {
        expect(DateType.required._properties).toBeUndefined();
    });

    test('RequiredDateType does not have items', () => {
        expect(DateType.required._items).toBeUndefined();
    });

    test('RequiredDateType is not a resolved type', () => {
        expect(DateType.required._resolved).toBe(false);
    });
});
