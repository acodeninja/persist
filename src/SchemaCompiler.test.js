import test from 'ava';
import Type from './type/index.js';
import SchemaCompiler, {CompiledSchema, ValidationError} from './SchemaCompiler.js';

/**
 * @class TestModel
 * @extends Type.Model
 * @property {object} custom
 * @property {string?} string
 * @property {string?} stringSlug
 * @property {string} requiredString
 * @property {string} requiredStringSlug
 * @property {number?} number
 * @property {number} requiredNumber
 * @property {boolean?} boolean
 * @property {boolean} requiredBoolean
 * @property {string[]?} arrayOfString
 * @property {number[]?} arrayOfNumber
 * @property {boolean[]?} arrayOfBoolean
 * @property {string[]} requiredArrayOfString
 * @property {number[]} requiredArrayOfNumber
 * @property {boolean[]} requiredArrayOfBoolean
 */
class TestModel extends Type.Model {
    static custom = Type.Custom.of({
        type: 'object',
        additionalProperties: false,
        properties: {test: {type: 'string'}},
        required: ['test'],
    });
    static string = Type.String;
    static stringSlug = Type.Resolved.Slug.of('string');
    static requiredString = Type.String.required;
    static requiredStringSlug = Type.Resolved.Slug.of('requiredString');
    static number = Type.Number;
    static requiredNumber = Type.Number.required;
    static boolean = Type.Boolean;
    static requiredBoolean = Type.Boolean.required;
    static arrayOfString = Type.Array.of(Type.String);
    static arrayOfNumber = Type.Array.of(Type.Number);
    static arrayOfBoolean = Type.Array.of(Type.Boolean);
    static requiredArrayOfString = Type.Array.of(Type.String).required;
    static requiredArrayOfNumber = Type.Array.of(Type.Number).required;
    static requiredArrayOfBoolean = Type.Array.of(Type.Boolean).required;
    static link = () => TestModel;
    static requiredLink = () => TestModel.required;
}

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
    arrayOfString: Type.Array.of(Type.String),
    arrayOfNumber: Type.Array.of(Type.Number),
    arrayOfBoolean: Type.Array.of(Type.Boolean),
    requiredArrayOfString: Type.Array.of(Type.String).required,
    requiredArrayOfNumber: Type.Array.of(Type.Number).required,
    requiredArrayOfBoolean: Type.Array.of(Type.Boolean).required,
    link: TestModel,
    requiredLink: TestModel.required,
};

const valid = {
    string: 'string',
    requiredString: 'required-string',
    number: 24.3,
    requiredNumber: 12.2,
    boolean: false,
    requiredBoolean: true,
    arrayOfString: ['string'],
    arrayOfNumber: [24.5],
    arrayOfBoolean: [false],
    requiredArrayOfString: ['string'],
    requiredArrayOfNumber: [24.5],
    requiredArrayOfBoolean: [false],
    link: new TestModel(),
    requiredLink: new TestModel(),
};

const invalid = {
    string: false,
    requiredString: undefined,
    number: 'test',
    requiredNumber: undefined,
    boolean: 13.4,
    requiredBoolean: undefined,
    arrayOfString: [true],
    arrayOfNumber: ['string'],
    arrayOfBoolean: [15.8],
    requiredArrayOfString: [true],
    requiredArrayOfNumber: ['string'],
    requiredArrayOfBoolean: [15.8],
    link: 'string',
    requiredLink: undefined,
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
    message: 'must have required property \'requiredLink\'',
    params: {missingProperty: 'requiredLink'},
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
    instancePath: '/link',
    keyword: 'type',
    message: 'must be object',
    params: {type: 'object'},
    schemaPath: '#/properties/link/type',
}];

const validModel = new TestModel({
    string: 'string',
    requiredString: 'required-string',
    number: 24.3,
    requiredNumber: 12.2,
    boolean: false,
    requiredBoolean: true,
    arrayOfString: ['string'],
    arrayOfNumber: [24.5],
    arrayOfBoolean: [false],
    requiredArrayOfString: ['string'],
    requiredArrayOfNumber: [24.5],
    requiredArrayOfBoolean: [false],
    link: new TestModel(),
    requiredLink: new TestModel(),
});

const invalidModel = new TestModel({
    string: false,
    requiredString: undefined,
    number: 'test',
    requiredNumber: undefined,
    boolean: 13.4,
    requiredBoolean: undefined,
    arrayOfString: [true],
    arrayOfNumber: ['string'],
    arrayOfBoolean: [15.8],
    requiredArrayOfString: [true],
    requiredArrayOfNumber: ['string'],
    requiredArrayOfBoolean: [15.8],
    link: 'string',
    requiredLink: undefined,
});

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
            'requiredArrayOfString',
            'requiredArrayOfNumber',
            'requiredArrayOfBoolean',
            'requiredLink',
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
            arrayOfString: {type: 'array', items: {type: 'string'}},
            arrayOfNumber: {type: 'array', items: {type: 'number'}},
            arrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            requiredArrayOfString: {type: 'array', items: {type: 'string'}},
            requiredArrayOfNumber: {type: 'array', items: {type: 'number'}},
            requiredArrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            link: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^TestModel/[A-Z0-9]+$',
                    },
                },
            },
            requiredLink: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^TestModel/[A-Z0-9]+$',
                    },
                },
            },
        },
    });
});

test('.compile(schema).validate(valid) returns true', t => {
    t.true(SchemaCompiler.compile(schema).validate(valid));
});

test('.compile(schema).validate(invalid) throws a ValidationError', t => {
    const error = t.throws(
        () => SchemaCompiler.compile(schema).validate(invalid),
        {instanceOf: ValidationError},
    );

    t.is(error.message, 'Validation failed');
    t.is(error.data, invalid);
    t.deepEqual(error.errors, invalidDataErrors);
});

test('.compile(TestModel) has the given schema associated with it', t => {
    t.deepEqual(SchemaCompiler.compile(TestModel)._schema, {
        type: 'object',
        additionalProperties: false,
        required: [
            'id',
            'requiredString',
            'requiredNumber',
            'requiredBoolean',
            'requiredArrayOfString',
            'requiredArrayOfNumber',
            'requiredArrayOfBoolean',
            'requiredLink',
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
            arrayOfString: {type: 'array', items: {type: 'string'}},
            arrayOfNumber: {type: 'array', items: {type: 'number'}},
            arrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            requiredArrayOfString: {type: 'array', items: {type: 'string'}},
            requiredArrayOfNumber: {type: 'array', items: {type: 'number'}},
            requiredArrayOfBoolean: {type: 'array', items: {type: 'boolean'}},
            link: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^TestModel/[A-Z0-9]+$',
                    },
                },
            },
            requiredLink: {
                type: 'object',
                additionalProperties: false,
                required: ['id'],
                properties: {
                    id: {
                        type: 'string',
                        pattern: '^TestModel/[A-Z0-9]+$',
                    },
                },
            },
        },
    });
});

test('.compile(TestModel).validate(validModel) returns true', t => {
    t.true(SchemaCompiler.compile(TestModel).validate(validModel));
});

test('.compile(TestModel).validate(invalidModel) throws a ValidationError', t => {
    t.plan(Object.keys(invalidModel).length + 4);

    const error = t.throws(
        () => SchemaCompiler.compile(TestModel).validate(invalidModel),
        {instanceOf: ValidationError},
    );

    t.is(error.message, 'Validation failed');

    t.true(!!error.data.id.match(/TestModel\/[A-Z0-9]+/));

    for (const name of Object.keys(invalidModel)) {
        t.is(error.data[name], invalidModel[name]);
    }

    t.deepEqual(error.errors, invalidDataErrors);
});
