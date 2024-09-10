import DateType from './DateType.js';
import test from 'ava';

test('DateType is Date', t => {
    t.is(DateType.toString(), 'Date');
});

test('DateType is not required', t => {
    t.is(DateType._required, false);
});

test('DateType does not have properties', t => {
    t.is(DateType._properties, undefined);
});

test('DateType does not have items', t => {
    t.is(DateType._items, undefined);
});

test('DateType is not a resolved type', t => {
    t.is(DateType._resolved, false);
});

test('RequiredDateType is RequiredDate', t => {
    t.is(DateType.required.toString(), 'RequiredDate');
});

test('RequiredDateType is required', t => {
    t.is(DateType.required._required, true);
});

test('RequiredDateType does not have properties', t => {
    t.is(DateType.required._properties, undefined);
});

test('RequiredDateType does not have items', t => {
    t.is(DateType.required._items, undefined);
});

test('RequiredDateType is not a resolved type', t => {
    t.is(DateType.required._resolved, false);
});
