import test from 'ava';
import Type from './index.js';
import {ValidationError} from '../SchemaCompiler.js';

/**
 * @class TestModel
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

const valid = {
    string: 'String',
    requiredString: 'Required String',
    number: 24.3,
    requiredNumber: 12.2,
    boolean: false,
    requiredBoolean: true,
    arrayOfString: ['String'],
    arrayOfNumber: [24.5],
    arrayOfBoolean: [false],
    requiredArrayOfString: ['String'],
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

test('constructor() creates a model instance with an id', t => {
    const model = new TestModel();

    t.true(!!model.id.match(/TestModel\/[A-Z0-9]+/));
});

test('constructor(valid) creates a model using the input valid', t => {
    const model = new TestModel(valid);

    t.true(!!model.id.match(/TestModel\/[A-Z0-9]+/));

    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
        link: {id: valid.link.id},
        requiredLink: {id: valid.requiredLink.id},
    });
});

test('model.toData() returns an object representation of the model', t => {
    const model = new TestModel(valid);

    t.true(!!model.id.match(/TestModel\/[A-Z0-9]+/));

    t.like(model.toData(), {
        ...valid,
        stringSlug: 'string',
        requiredStringSlug: 'required-string',
        link: {id: valid.link.id},
        requiredLink: {id: valid.requiredLink.id},
    });
});

test('model.validate() returns true', t => {
    const model = new TestModel(valid);
    t.true(model.validate());
});

test('invalidModel.validate() returns true', t => {
    const model = new TestModel(invalid);
    t.throws(() => model.validate(), {instanceOf: ValidationError});
});

test('Model.isModel(model) returns true', t => {
    t.true(Type.Model.isModel(new TestModel()));
});

test('Model.isModel(non-model) returns false', t => {
    t.false(Type.Model.isModel({}));
});
