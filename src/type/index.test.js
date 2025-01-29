import {expect, test} from '@jest/globals';
import ArrayType from './complex/ArrayType.js';
import BooleanType from './simple/BooleanType.js';
import CustomType from './complex/CustomType.js';
import NumberType from './simple/NumberType.js';
import SlugType from './resolved/SlugType.js';
import StringType from './simple/StringType.js';
import Type from './index.js';

test('exports Type.Boolean', () => {
    expect(Type.Boolean).toBe(BooleanType);
});

test('exports Type.String', () => {
    expect(Type.String).toBe(StringType);
});

test('exports Type.Number', () => {
    expect(Type.Number).toBe(NumberType);
});

test('exports Type.Model', () => {
    expect(Type.Number).toBe(NumberType);
});

test('exports Type.Array', () => {
    expect(Type.Array).toBe(ArrayType);
});

test('exports Type.Custom', () => {
    expect(Type.Custom).toBe(CustomType);
});

test('exports Type.Resolved.Slug', () => {
    expect(Type.Resolved.Slug).toBe(SlugType);
});
