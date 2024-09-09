import {MainModel, getTestModelInstance, invalid, valid} from '../test/fixtures/TestModel.js';
import SchemaCompiler, {CompiledSchema, ValidationError} from './SchemaCompiler.js';
import Type from './type/index.js';
import test from 'ava';

const schema = {
    custom: Type.Custom.of({
        type: 'object',
        additionalProperties: false,
        properties: {test: {type: 'string'}},
        required: ['test'],
    }),
    string: Type.String,
    stringSlug: Type.Resolved.Slug.of('string'),
    requiredString: Type.String.required,
    requiredStringSlug: Type.Resolved.Slug.of('requiredString'),
    number: Type.Number,
    requiredNumber: Type.Number.required,
    boolean: Type.Boolean,
    requiredBoolean: Type.Boolean.required,
    date: Type.Date,
    requiredDate: Type.Date.required,
    arrayOfString: Type.Array.of(Type.String),
    arrayOfNumber: Type.Array.of(Type.Number),
    arrayOfBoolean: Type.Array.of(Type.Boolean),
    arrayOfDate: Type.Array.of(Type.Date),
    requiredArrayOfString: Type.Array.of(Type.String).required,
    requiredArrayOfNumber: Type.Array.of(Type.Number).required,
    requiredArrayOfBoolean: Type.Array.of(Type.Boolean).required,
    requiredArrayOfDate: Type.Array.of(Type.Date).required,
};

const invalidDataErrors = [{
    instancePath: '',
    keyword: 'required',
    message: 'must have required property \'requiredString\'',
    params: {missingProperty: 'requiredString'},
    schemaPath: '#/required',
}, {
    instancePath: '',
    keyword: 'required',
    message: 'must have required property \'requiredNumber\'',
    params: {missingProperty: 'requiredNumber'},
    schemaPath: '#/required',
}, {
    instancePath: '',
    keyword: 'required',
    message: 'must have required property \'requiredBoolean\'',
    params: {missingProperty: 'requiredBoolean'},
    schemaPath: '#/required',
}, {
    instancePath: '',
    keyword: 'required',
    message: 'must have required property \'requiredDate\'',
    params: {missingProperty: 'requiredDate'},
    schemaPath: '#/required',
}, {
    instancePath: '/string',
    keyword: 'type',
    message: 'must be string',
    params: {type: 'string'},
    schemaPath: '#/properties/string/type',
}, {
    instancePath: '/number',
    keyword: 'type',
    message: 'must be number',
    params: {type: 'number'},
    schemaPath: '#/properties/number/type',
}, {
    instancePath: '/boolean',
    keyword: 'type',
    message: 'must be boolean',
    params: {type: 'boolean'},
    schemaPath: '#/properties/boolean/type',
}, {
    instancePath: '/date',
    keyword: 'format',
    message: 'must match format "iso-date-time"',
    params: {format: 'iso-date-time'},
    schemaPath: '#/properties/date/format',
}, {
    instancePath: '/arrayOfString/0',
    keyword: 'type',
    message: 'must be string',
    params: {type: 'string'},
    schemaPath: '#/properties/arrayOfString/items/type',
}, {
    instancePath: '/arrayOfNumber/0',
    keyword: 'type',
    message: 'must be number',
    params: {type: 'number'},
    schemaPath: '#/properties/arrayOfNumber/items/type',
}, {
    instancePath: '/arrayOfBoolean/0',
    keyword: 'type',
    message: 'must be boolean',
    params: {type: 'boolean'},
    schemaPath: '#/properties/arrayOfBoolean/items/type',
}, {
    instancePath: '/arrayOfDate/0',
    keyword: 'format',
    message: 'must match format "iso-date-time"',
    params: {format: 'iso-date-time'},
    schemaPath: '#/properties/arrayOfDate/items/format',
}, {
    instancePath: '/requiredArrayOfString/0',
    keyword: 'type',
    message: 'must be string',
    params: {type: 'string'},
    schemaPath: '#/properties/requiredArrayOfString/items/type',
}, {
    instancePath: '/requiredArrayOfNumber/0',
    keyword: 'type',
    message: 'must be number',
    params: {type: 'number'},
    schemaPath: '#/properties/requiredArrayOfNumber/items/type',
}, {
    instancePath: '/requiredArrayOfBoolean/0',
    keyword: 'type',
    message: 'must be boolean',
    params: {type: 'boolean'},
    schemaPath: '#/properties/requiredArrayOfBoolean/items/type',
}, {
    instancePath: '/requiredArrayOfDate/0',
    keyword: 'format',
    message: 'must match format "iso-date-time"',
    params: {format: 'iso-date-time'},
    schemaPath: '#/properties/requiredArrayOfDate/items/format',
}];

test('.compile(schema) is an instance of CompiledSchema', t => {
    t.true(SchemaCompiler.compile(schema).prototype instanceof CompiledSchema);
});

test('.compile(schema) has the given schema associated with it', t => {
    t.deepEqual(SchemaCompiler.compile(schema)._schema, {
        type: 'object',
        additionalProperties: false,
        required: [
            'requiredString',
            'requiredNumber',
            'requiredBoolean',
            'requiredDate',
            'requiredArrayOfString',
            'requiredArrayOfNumber',
            'requiredArrayOfBoolean',
            'requiredArrayOfDate',
        ],
        properties: {
            custom: {
                type: 'object',
                additionalProperties: false,
                properties: {test: {type: 'string'}},
                required: ['test'],
            },
            string: {type: 'string'},
            stringSlug: {type: 'string'},
            requiredString: {type: 'string'},
            requiredStringSlug: {type: 'string'},
            number: {type: 'number'},
            requiredNumber: {type: 'number'},
            boolean: {type: 'boolean'},
            requiredBoolean: {type: 'boolean'},
            date: {type: 'string', format: 'iso-date-time'},
            requiredDate: {type: 'string', format: 'iso-date-time'},
            arrayOfString: {type: 'array', items: {type: 'string'}},
            arrayOfNumber: {type: 'array', items: {type: 'number'}},
            arrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            arrayOfDate: {type: 'array', items: {type: 'string', format: 'iso-date-time'}},
            requiredArrayOfString: {type: 'array', items: {type: 'string'}},
            requiredArrayOfNumber: {type: 'array', items: {type: 'number'}},
            requiredArrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            requiredArrayOfDate: {type: 'array', items: {type: 'string', format: 'iso-date-time'}},
        },
    });
});

test('.compile(schema).validate(valid) returns true', t => {
    delete valid.id;

    t.true(SchemaCompiler.compile(schema).validate(valid));
});

test('.compile(schema).validate(invalid) throws a ValidationError', t => {
    delete invalid.id;

    const error = t.throws(
        () => SchemaCompiler.compile(schema).validate(invalid),
        {instanceOf: ValidationError},
    );

    t.is(error.message, 'Validation failed');
    t.is(error.data, invalid);
    t.deepEqual(error.errors, invalidDataErrors);
});

test('.compile(MainModel) has the given schema associated with it', t => {
    t.deepEqual(SchemaCompiler.compile(MainModel)._schema, {
        type: 'object',
        additionalProperties: false,
        required: [
            'id',
            'requiredString',
            'requiredNumber',
            'requiredBoolean',
            'requiredDate',
            'requiredArrayOfString',
            'requiredArrayOfNumber',
            'requiredArrayOfBoolean',
            'requiredArrayOfDate',
            'requiredLinked',
        ],
        properties: {
            id: {type: 'string'},
            custom: {
                type: 'object',
                additionalProperties: false,
                properties: {test: {type: 'string'}},
                required: ['test'],
            },
            string: {type: 'string'},
            stringSlug: {type: 'string'},
            requiredString: {type: 'string'},
            requiredStringSlug: {type: 'string'},
            number: {type: 'number'},
            requiredNumber: {type: 'number'},
            boolean: {type: 'boolean'},
            requiredBoolean: {type: 'boolean'},
            date: {type: 'string', format: 'iso-date-time'},
            requiredDate: {type: 'string', format: 'iso-date-time'},
            arrayOfString: {type: 'array', items: {type: 'string'}},
            arrayOfNumber: {type: 'array', items: {type: 'number'}},
            arrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            arrayOfDate: {type: 'array', items: {type: 'string', format: 'iso-date-time'}},
            requiredArrayOfString: {type: 'array', items: {type: 'string'}},
            requiredArrayOfNumber: {type: 'array', items: {type: 'number'}},
            requiredArrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            requiredArrayOfDate: {type: 'array', items: {type: 'string', format: 'iso-date-time'}},
            requiredLinked: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^LinkedModel/[A-Z0-9]+$',
                    },
                },
            },
            linked: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^LinkedModel/[A-Z0-9]+$',
                    },
                },
            },
            linkedMany: {
                type: 'array',
                items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['id'],
                    properties: {
                        id: {
                            type: 'string',
                            pattern: '^LinkedManyModel/[A-Z0-9]+$',
                        },
                    },
                },
            },
            circular: {
                additionalProperties: false,
                properties: {
                    id: {pattern: '^CircularModel/[A-Z0-9]+$', type: 'string'},
                },
                required: ['id'],
                type: 'object',
            },
            circularMany: {
                items: {
                    additionalProperties: false,
                    properties: {
                        id: {pattern: '^CircularManyModel/[A-Z0-9]+$', type: 'string'},
                    },
                    required: ['id'],
                    type: 'object',
                },
                type: 'array',
            },
        },
    });
});

test('.compile(MainModel).validate(validModel) returns true', t => {
    t.true(SchemaCompiler.compile(MainModel).validate(getTestModelInstance(valid)));
});

test('.compile(MainModel).validate(invalidModel) throws a ValidationError', t => {
    const invalidModel = getTestModelInstance(invalid);

    t.plan(Object.keys(invalidModel).length + 6);

    const error = t.throws(
        () => SchemaCompiler.compile(MainModel).validate(invalidModel),
        {instanceOf: ValidationError},
    );

    t.is(error.message, 'Validation failed');

    t.true(!!error.data.id.match(/MainModel\/[A-Z0-9]+/));

    for (const [name, value] of Object.entries(invalidModel.toData())) {
        t.deepEqual(error.data[name], value);
    }

    t.deepEqual(error.errors, [
        ...invalidDataErrors,
        {
            instancePath: '/circular/id',
            keyword: 'pattern',
            message: 'must match pattern "^CircularModel/[A-Z0-9]+$"',
            params: {pattern: '^CircularModel/[A-Z0-9]+$'},
            schemaPath: '#/properties/circular/properties/id/pattern',
        }, {
            instancePath: '/circularMany/0/id',
            keyword: 'pattern',
            message: 'must match pattern "^CircularManyModel/[A-Z0-9]+$"',
            params: {pattern: '^CircularManyModel/[A-Z0-9]+$'},
            schemaPath: '#/properties/circularMany/items/properties/id/pattern',
        }, {
            instancePath: '/linked/id',
            keyword: 'pattern',
            message: 'must match pattern "^LinkedModel/[A-Z0-9]+$"',
            params: {pattern: '^LinkedModel/[A-Z0-9]+$'},
            schemaPath: '#/properties/linked/properties/id/pattern',
        }, {
            instancePath: '/linkedMany/0/id',
            keyword: 'pattern',
            message: 'must match pattern "^LinkedManyModel/[A-Z0-9]+$"',
            params: {pattern: '^LinkedManyModel/[A-Z0-9]+$'},
            schemaPath: '#/properties/linkedMany/items/properties/id/pattern',
        },
    ]);
});
