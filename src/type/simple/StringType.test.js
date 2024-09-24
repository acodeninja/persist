import StringType from './StringType.js';
import test from 'ava';

test('StringType is String', t => {
    t.is(StringType.toString(), 'String');
});

test('StringType is not required', t => {
    t.is(StringType._required, false);
});

test('StringType does not have properties', t => {
    t.assert(StringType._properties === undefined);
});

test('StringType does not have items', t => {
    t.assert(StringType._items === undefined);
});

test('StringType is not a resolved type', t => {
    t.is(StringType._resolved, false);
});

test('RequiredStringType is RequiredString', t => {
    t.is(StringType.required.toString(), 'RequiredString');
});

test('RequiredStringType is required', t => {
    t.is(StringType.required._required, true);
});

test('RequiredStringType does not have properties', t => {
    t.assert(StringType.required._properties === undefined);
});

test('RequiredStringType does not have items', t => {
    t.assert(StringType.required._items === undefined);
});

test('RequiredStringType is not a resolved type', t => {
    t.is(StringType.required._resolved, false);
});
