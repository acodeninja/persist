import ResolvedType from './ResolvedType.js';
import test from 'ava';

class UnimplementedResolvedType extends ResolvedType {

}

test('UnimplementedResolvedType is of type UnimplementedResolved', t => {
    t.is(UnimplementedResolvedType.toString(), 'UnimplementedResolvedType');
});

test('UnimplementedResolvedType.of(name) is of type UnimplementedResolvedOf', t => {
    t.is(UnimplementedResolvedType.of('name').toString(), 'ResolvedTypeOf(name)');
});

test('UnimplementedResolvedType is not required', t => {
    t.is(UnimplementedResolvedType._required, false);
});

test('UnimplementedResolvedType does not have properties', t => {
    t.assert(UnimplementedResolvedType._properties === undefined);
});

test('UnimplementedResolvedType does not have items', t => {
    t.assert(UnimplementedResolvedType._items === undefined);
});

test('UnimplementedResolvedType is a resolved type', t => {
    t.is(UnimplementedResolvedType._resolved, true);
});

test('UnimplementedResolvedType raises a not implemented error on resolving', t => {
    t.throws(() => {
        UnimplementedResolvedType.resolve({});
    }, {
        instanceOf: Error,
        message: 'UnimplementedResolvedType does not implement resolve(model)',
    });
});

test('UnimplementedResolvedType.of(propertyName) raises a not implemented error on resolving', t => {
    t.throws(() => {
        UnimplementedResolvedType.of('name').resolve({});
    }, {
        instanceOf: Error,
        message: 'ResolvedTypeOf does not implement resolve(model)',
    });
});
