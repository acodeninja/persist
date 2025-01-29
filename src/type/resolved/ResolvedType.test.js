import {expect, test} from '@jest/globals';
import ResolvedType from './ResolvedType.js';

class UnimplementedResolvedType extends ResolvedType {

}

test('UnimplementedResolvedType is of type UnimplementedResolved', () => {
    expect(UnimplementedResolvedType.toString()).toBe('UnimplementedResolvedType');
});

test('UnimplementedResolvedType.of(name) is of type UnimplementedResolvedOf', () => {
    expect(UnimplementedResolvedType.of('name').toString()).toBe('ResolvedTypeOf(name)');
});

test('UnimplementedResolvedType is not required', () => {
    expect(UnimplementedResolvedType._required).toBe(false);
});

test('UnimplementedResolvedType does not have properties', () => {
    expect(UnimplementedResolvedType._properties).toBe(undefined);
});

test('UnimplementedResolvedType does not have items', () => {
    expect(UnimplementedResolvedType._items).toBe(undefined);
});

test('UnimplementedResolvedType is a resolved type', () => {
    expect(UnimplementedResolvedType._resolved).toBe(true);
});

test('UnimplementedResolvedType raises a not implemented error on resolving', () => {
    expect(() => {
        UnimplementedResolvedType.resolve({});
    }).toThrowError({
        instanceOf: Error,
        message: 'UnimplementedResolvedType does not implement resolve(model)',
    });
});

test('UnimplementedResolvedType.of(propertyName) raises a not implemented error on resolving', () => {
    expect(() => {
        UnimplementedResolvedType.of('name').resolve({});
    }).toThrowError({
        instanceOf: Error,
        message: 'ResolvedTypeOf does not implement resolve(model)',
    });
});
