import Persist from '@acodeninja/persist';
import test from 'ava';

test('Persist contains the String Type', t => {
    t.is(Persist.Type.String.name, 'String');
});

test('Persist contains the Number Type', t => {
    t.is(Persist.Type.Number.name, 'Number');
});

test('Persist contains the Boolean Type', t => {
    t.is(Persist.Type.Boolean.name, 'Boolean');
});

test('Persist contains the Date Type', t => {
    t.is(Persist.Type.Date.name, 'Date');
});

test('Persist contains the Resolved Slug Type', t => {
    t.is(Persist.Type.Resolved.Slug.name, 'Slug');
});

test('Persist contains the Complex Custom Type', t => {
    t.is(Persist.Type.Custom.name, 'Custom');
});

test('Persist contains the Model Type', t => {
    t.is(Persist.Type.Model.name, 'Model');
});
