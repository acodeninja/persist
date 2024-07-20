import test from 'ava';
import CustomType from './CustomType.js';

const validSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        string: {type: 'string'},
        number: {type: 'number'},
        boolean: {type: 'boolean'},
    },
};

test('CustomType.of(validSchema) is Custom', t => {
    t.is(CustomType.of(validSchema).toString(), 'Custom');
});

test('CustomType.of(validSchema) is not required', t => {
    t.is(CustomType.of(validSchema)._required, false);
});

test('CustomType.of(validSchema) does not have properties', t => {
    t.is(CustomType.of(validSchema)._properties, undefined);
});

test('CustomType.of(validSchema) has items of type String', t => {
    t.is(CustomType.of(validSchema)._items, undefined);
});

test('CustomType.of(validSchema) is not a resolved type', t => {
    t.is(CustomType.of(validSchema)._resolved, false);
});

test('RequiredCustomType.of(validSchema) is RequiredCustom', t => {
    t.is(CustomType.of(validSchema).required.toString(), 'RequiredCustom');
});

test('RequiredCustomType.of(validSchema) is required', t => {
    t.is(CustomType.of(validSchema).required._required, true);
});

test('RequiredCustomType.of(validSchema) does not have properties', t => {
    t.is(CustomType.of(validSchema).required._properties, undefined);
});

test('RequiredCustomType.of(validSchema) has items of type String', t => {
    t.is(CustomType.of(validSchema).required._items, undefined);
});

test('RequiredCustomType.of(validSchema) is not a resolved type', t => {
    t.is(CustomType.of(validSchema).required._resolved, false);
});

const invalidSchema = {
    additional: false,
    properties: {
        string: {type: 'not'},
        number: {type: 'a'},
        boolean: {type: 'real'},
    },
    type: 'schema',
};

test('CustomType.of(invalidSchema) throws an invalid schema error', t => {
    const error = t.throws(() => {
        CustomType.of(invalidSchema);
    }, {instanceOf: Error});

    t.is(
        error.message,
        'schema is invalid: data/properties/string/type must be equal to one of the allowed ' +
        'values, data/properties/string/type must be array, data/properties/string/type must ' +
        'match a schema in anyOf',
    );
});
