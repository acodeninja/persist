import Type from './Type.js';
import test from 'ava';

test('Type is of type Type', t => {
    t.is(Type.toString(), 'Type');
});

test('Type is not required', t => {
    t.is(Type._required, false);
});

test('Type does not have properties', t => {
    t.assert(Type._properties === undefined);
});

test('Type does not have items', t => {
    t.assert(Type._items === undefined);
});

test('Type is not a resolved type', t => {
    t.is(Type._resolved, false);
});

test('RequiredType is of Required type', t => {
    t.is(Type.required.toString(), 'RequiredType');
});

test('RequiredType is required', t => {
    t.is(Type.required._required, true);
});

test('RequiredType does not have properties', t => {
    t.assert(Type.required._properties === undefined);
});

test('RequiredType does not have items', t => {
    t.assert(Type.required._items === undefined);
});

test('RequiredType is not a resolved type', t => {
    t.is(Type.required._resolved, false);
});
