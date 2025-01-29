import {expect, test} from '@jest/globals';
import Persist from '@acodeninja/persist';

test('Persist contains the String Type', () => {
    expect(Persist.Type.String.name).toBe('String');
});

test('Persist contains the Number Type', () => {
    expect(Persist.Type.Number.name).toBe('Number');
});

test('Persist contains the Boolean Type', () => {
    expect(Persist.Type.Boolean.name).toBe('Boolean');
});

test('Persist contains the Date Type', () => {
    expect(Persist.Type.Date.name).toBe('Date');
});

test('Persist contains the Resolved Slug Type', () => {
    expect(Persist.Type.Resolved.Slug.name).toBe('Slug');
});

test('Persist contains the Complex Custom Type', () => {
    expect(Persist.Type.Custom.name).toBe('Custom');
});

test('Persist contains the Model Type', () => {
    expect(Persist.Type.Model.name).toBe('Model');
});
