import SchemaCompiler, {CompiledSchema} from './SchemaCompiler.js';
import {expect, test} from '@jest/globals';
import {MainModel} from '../test/fixtures/Models.js';
import {Models} from '../test/fixtures/ModelCollection.js';
import Type from './type/index.js';

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
    emptyArrayOfStrings: Type.Array.of(Type.String),
    emptyArrayOfNumbers: Type.Array.of(Type.Number),
    emptyArrayOfBooleans: Type.Array.of(Type.Boolean),
    emptyArrayOfDates: Type.Array.of(Type.Date),
    arrayOfString: Type.Array.of(Type.String),
    arrayOfNumber: Type.Array.of(Type.Number),
    arrayOfBoolean: Type.Array.of(Type.Boolean),
    arrayOfDate: Type.Array.of(Type.Date),
    requiredArrayOfString: Type.Array.of(Type.String).required,
    requiredArrayOfNumber: Type.Array.of(Type.Number).required,
    requiredArrayOfBoolean: Type.Array.of(Type.Boolean).required,
    requiredArrayOfDate: Type.Array.of(Type.Date).required,
};

export const valid = {
    custom: {test: 'string'},
    string: 'String',
    requiredString: 'Required String',
    number: 24.3,
    requiredNumber: 12.2,
    boolean: false,
    requiredBoolean: true,
    date: new Date().toISOString(),
    requiredDate: new Date().toISOString(),
    emptyArrayOfStrings: [],
    emptyArrayOfNumbers: [],
    emptyArrayOfBooleans: [],
    emptyArrayOfDates: [],
    arrayOfString: ['String'],
    arrayOfNumber: [24.5],
    arrayOfBoolean: [false],
    arrayOfDate: [new Date().toISOString()],
    requiredArrayOfString: ['String'],
    requiredArrayOfNumber: [24.5],
    requiredArrayOfBoolean: [false],
    requiredArrayOfDate: [new Date().toISOString()],
};

export const invalid = {
    custom: {test: 123, additional: false},
    string: false,
    requiredString: undefined,
    number: 'test',
    requiredNumber: undefined,
    boolean: 13.4,
    requiredBoolean: undefined,
    date: 'not-a-date',
    requiredDate: undefined,
    emptyArrayOfStrings: 'not-a-list',
    emptyArrayOfNumbers: 'not-a-list',
    emptyArrayOfBooleans: 'not-a-list',
    emptyArrayOfDates: 'not-a-list',
    arrayOfString: [true],
    arrayOfNumber: ['string'],
    arrayOfBoolean: [15.8],
    arrayOfDate: ['not-a-date'],
    requiredArrayOfString: [true],
    requiredArrayOfNumber: ['string'],
    requiredArrayOfBoolean: [15.8],
    requiredArrayOfDate: ['not-a-date'],
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
    instancePath: '/custom',
    keyword: 'additionalProperties',
    message: 'must NOT have additional properties',
    params: {additionalProperty: 'additional'},
    schemaPath: '#/properties/custom/additionalProperties',
}, {
    instancePath: '/custom/test',
    keyword: 'type',
    message: 'must be string',
    params: {type: 'string'},
    schemaPath: '#/properties/custom/properties/test/type',
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
    instancePath: '/emptyArrayOfStrings',
    keyword: 'type',
    message: 'must be array',
    params: {type: 'array'},
    schemaPath: '#/properties/emptyArrayOfStrings/type',
}, {
    instancePath: '/emptyArrayOfNumbers',
    keyword: 'type',
    message: 'must be array',
    params: {type: 'array'},
    schemaPath: '#/properties/emptyArrayOfNumbers/type',
}, {
    instancePath: '/emptyArrayOfBooleans',
    keyword: 'type',
    message: 'must be array',
    params: {type: 'array'},
    schemaPath: '#/properties/emptyArrayOfBooleans/type',
}, {
    instancePath: '/emptyArrayOfDates',
    keyword: 'type',
    message: 'must be array',
    params: {type: 'array'},
    schemaPath: '#/properties/emptyArrayOfDates/type',
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

test('.compile(schema) is an instance of CompiledSchema', () => {
    expect(SchemaCompiler.compile(schema).prototype).toBeInstanceOf(CompiledSchema);
});

test('.compile(schema) has the given schema associated with it', () => {
    expect(SchemaCompiler.compile(schema)._schema).toEqual({
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
            emptyArrayOfStrings: {type: 'array', items: {type: 'string'}},
            emptyArrayOfNumbers: {type: 'array', items: {type: 'number'}},
            emptyArrayOfBooleans: {type: 'array', items: {type: 'boolean'}},
            emptyArrayOfDates: {type: 'array', items: {type: 'string', format: 'iso-date-time'}},
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

test('.compile(schema).validate(valid) returns true', () => {
    expect(SchemaCompiler.compile(schema).validate(valid)).toBeTruthy();
});

test('.compile(schema).validate(invalid) throws a ValidationError', () => {
    expect(() => SchemaCompiler.compile(schema).validate(invalid))
        .toThrowError(expect.objectContaining({
            message: 'Validation failed',
            errors: invalidDataErrors,
            data: invalid,
        }));
});

test('.compile(MainModel) has the given schema associated with it', () => {
    expect(SchemaCompiler.compile(MainModel)._schema).toEqual({
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
            'circularRequired',
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
            emptyArrayOfStrings: {type: 'array', items: {type: 'string'}},
            emptyArrayOfNumbers: {type: 'array', items: {type: 'number'}},
            emptyArrayOfBooleans: {type: 'array', items: {type: 'boolean'}},
            emptyArrayOfDates: {type: 'array', items: {type: 'string', format: 'iso-date-time'}},
            emptyArrayOfModels: {
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
            circularRequired: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^CircularRequiredModel/[A-Z0-9]+$',
                    },
                },
            },
        },
    });
});

test('.compile(MainModel).validate(validModel) returns true', () => {
    const model = new Models().createFullTestModel();
    expect(SchemaCompiler.compile(MainModel).validate(model)).toBe(true);
});

test('.compile(MainModel).validate(invalidModel) throws a ValidationError', () => {
    const invalidModel = new Models().createFullTestModel(invalid);

    invalidModel.circular.id = 'CircularModel/not-a-valid-id';
    invalidModel.circularMany[0].id = 'CircularManyModel/not-a-valid-id';
    invalidModel.linked.id = 'LinkedModel/not-a-valid-id';
    invalidModel.linkedMany[0].id = 'LinkedManyModel/not-a-valid-id';

    expect(() => SchemaCompiler.compile(MainModel).validate(invalidModel))
        .toThrow(expect.objectContaining({
            message: 'Validation failed',
            data: invalidModel.toData(),
            errors: [
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
        ]}));
});
