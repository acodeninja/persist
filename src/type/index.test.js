import test from 'ava';
import Type from './index.js';
import BooleanType from './simple/BooleanType.js';
import SlugType from './resolved/SlugType.js';
import ArrayType from './complex/ArrayType.js';
import NumberType from './simple/NumberType.js';
import StringType from './simple/StringType.js';
import CustomType from './complex/CustomType.js';

test('exports Type.Boolean', t => {
    t.is(Type.Boolean, BooleanType);
});

test('exports Type.String', t => {
    t.is(Type.String, StringType);
});

test('exports Type.Number', t => {
    t.is(Type.Number, NumberType);
});

test('exports Type.Model', t => {
    t.is(Type.Number, NumberType);
});

test('exports Type.Array', t => {
    t.is(Type.Array, ArrayType);
});

test('exports Type.Custom', t => {
    t.is(Type.Custom, CustomType);
});

test('exports Type.Resolved.Slug', t => {
    t.is(Type.Resolved.Slug, SlugType);
});
