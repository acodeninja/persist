import {
    LinkedModelWithSearchIndex,
    LinkedModelWithSearchIndexFactory,
    SimpleModel,
} from '../test/fixtures/Model.js';
import Schema, {CompiledSchema, ValidationError} from './Schema.js';
import {beforeAll, describe, expect, test} from '@jest/globals';
import Model from './data/Model.js';
import Property from './data/Property.js';

class SchemaTestLinkedModel extends Model {

}

class SchemaTestCircularModel extends Model {
    static linked = () => SchemaTestCircularModel;
}

class SchemaTestModel extends Model {
    static custom = Property.Custom.of({
        type: 'object',
        additionalProperties: false,
        properties: {test: {type: 'string'}},
        required: ['test'],
    });
    static string = Property.String;
    static stringSlug = Property.Slug.of('string');
    static requiredString = Property.String.required;
    static requiredStringSlug = Property.Slug.of('requiredString');
    static number = Property.Number;
    static requiredNumber = Property.Number.required;
    static boolean = Property.Boolean;
    static requiredBoolean = Property.Boolean.required;
    static date = Property.Date;
    static requiredDate = Property.Date.required;
    static emptyArrayOfStrings = Property.Array.of(Property.String);
    static emptyArrayOfNumbers = Property.Array.of(Property.Number);
    static emptyArrayOfBooleans = Property.Array.of(Property.Boolean);
    static emptyArrayOfDates = Property.Array.of(Property.Date);
    static arrayOfString = Property.Array.of(Property.String);
    static arrayOfNumber = Property.Array.of(Property.Number);
    static arrayOfBoolean = Property.Array.of(Property.Boolean);
    static arrayOfDate = Property.Array.of(Property.Date);
    static requiredArrayOfString = Property.Array.of(Property.String).required;
    static requiredArrayOfNumber = Property.Array.of(Property.Number).required;
    static requiredArrayOfBoolean = Property.Array.of(Property.Boolean).required;
    static requiredArrayOfDate = Property.Array.of(Property.Date).required;
    static linkedModel = SchemaTestLinkedModel;
    static requiredLinkedModel = SchemaTestLinkedModel.required;
    static circularModel = SchemaTestCircularModel;
    static requiredCircularModel = SchemaTestCircularModel.required;
}

describe('validating properties', () => {
    describe('when the value is valid', () => {
        test.each([
            [Property.String, 'string'],
            [Property.Number, 93.4],
            [Property.Boolean, false],
            [Property.Date, '2023-04-11T11:14:25.697Z'],
            [Property.Array.of(Property.String), ['string']],
            [Property.Array.of(Property.Number), [93.4]],
            [Property.Array.of(Property.Boolean), [true]],
            [Property.Array.of(Property.Date), ['2023-04-11T11:14:25.697Z']],
        ])('a %s property with %s', (property, value) => {
            const validator = Schema.compile(property);

            expect(validator.validate(value)).toBeTruthy();
        });
    });

    describe('when the value is not valid', () => {
        test.each([
            [Property.String, 1.3],
            [Property.Number, true],
            [Property.Boolean, 'true'],
            [Property.Date, false],
            [Property.Array.of(Property.String), [1.3]],
            [Property.Array.of(Property.String), 'string'],
            [Property.Array.of(Property.Number), [true]],
            [Property.Array.of(Property.Number), 1.3],
            [Property.Array.of(Property.Boolean), ['true']],
            [Property.Array.of(Property.Boolean), true],
            [Property.Array.of(Property.Date), ['string']],
            [Property.Array.of(Property.Date), '2023-04-11T11:14:25.697Z'],
        ])('a %s property with %s', (property, value) => {
            const validator = Schema.compile(property);

            expect(() => validator.validate(value)).toThrow({
                instanceOf: ValidationError,
                message: 'Validation failed',
            });
        });
    });
});

describe('validating a model', () => {
    test('.compile() returns an instance of CompiledSchema', () => {
        expect(Schema.compile(SimpleModel)).toBeInstanceOf(CompiledSchema);
    });

    describe('when the value is valid', () => {
        test('validation passes', () => {
            expect(
                Schema
                    .compile(LinkedModelWithSearchIndex)
                    .validate(LinkedModelWithSearchIndexFactory()),
            ).toBeTruthy();
        });
    });

    describe('when the value is invalid', () => {
        let error = null;
        const invalidModel = new SchemaTestModel({
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
        });

        beforeAll(() => {
            try {
                Schema.compile(SchemaTestModel).validate(invalidModel);
            } catch (e) {
                error = e;
            }
        });

        test('validation fails', () => {
            expect(error).toBeInstanceOf(ValidationError);
            expect(error).toHaveProperty('message', 'Validation failed');
        });

        test('validation error includes a list of errors', () => {
            expect(error).toHaveProperty('errors', [{
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
                instancePath: '',
                keyword: 'required',
                message: 'must have required property \'requiredLinkedModel\'',
                params: {missingProperty: 'requiredLinkedModel'},
                schemaPath: '#/required',
            }, {
                instancePath: '',
                keyword: 'required',
                message: 'must have required property \'requiredCircularModel\'',
                params: {missingProperty: 'requiredCircularModel'},
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
            }]);
        });

        test('validation error includes the data that failed validation', () => {
            expect(error).toHaveProperty('data', invalidModel.toData());
        });
    });
});
