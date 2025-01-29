import {expect, test} from '@jest/globals';
import SlugType from './SlugType.js';

test('SlugType is of type Slug', () => {
    expect(SlugType.toString()).toBe('Slug');
});

test('SlugType.of(name) is of type SlugOf', () => {
    expect(SlugType.of('name').toString()).toBe('SlugOf(name)');
});

test('SlugType is not required', () => {
    expect(SlugType._required).toBe(false);
});

test('SlugType does not have properties', () => {
    expect(SlugType._properties).toBeUndefined();
});

test('SlugType does not have items', () => {
    expect(SlugType._items).toBeUndefined();
});

test('SlugType is a resolved type', () => {
    expect(SlugType._resolved).toBe(true);
});

test('SlugType.of(name).resolve({name: \'Testing the Slug\')) returns \'testing-the-slug\'', () => {
    expect(SlugType.of('name').resolve({name: 'Testing the Slug'})).toBe('testing-the-slug');
});

test('SlugType.of(name).resolve({name: \' Trimming whitespace \')) returns \'trimming-whitespace\'', () => {
    expect(SlugType.of('name').resolve({name: ' Trimming whitespace '})).toBe('trimming-whitespace');
});

test('SlugType.of(name).resolve()) returns \'\'', () => {
    expect(SlugType.of('name').resolve()).toBe('');
});

test('SlugType.of(special).resolve({special: \'don\'t include special characters\')) returns \'dont-include-special-characters\'', () => {
    expect(
        SlugType.of('special').resolve({special: 'don\'t include special characters'}),
    ).toBe('dont-include-special-characters');
});
