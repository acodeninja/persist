import SlugType from './SlugType.js';
import test from 'ava';

test('SlugType is of type Slug', t => {
    t.is(SlugType.toString(), 'Slug');
});

test('SlugType.of(name) is of type SlugOf', t => {
    t.is(SlugType.of('name').toString(), 'SlugOf(name)');
});

test('SlugType is not required', t => {
    t.is(SlugType._required, false);
});

test('SlugType does not have properties', t => {
    t.assert(SlugType._properties === undefined);
});

test('SlugType does not have items', t => {
    t.assert(SlugType._items === undefined);
});

test('SlugType is a resolved type', t => {
    t.is(SlugType._resolved, true);
});

test('SlugType.of(name).resolve({name: \'Testing the Slug\')) returns \'testing-the-slug\'', t => {
    t.is(SlugType.of('name').resolve({name: 'Testing the Slug'}), 'testing-the-slug');
});

test('SlugType.of(name).resolve()) returns \'\'', t => {
    t.is(SlugType.of('name').resolve(), '');
});
