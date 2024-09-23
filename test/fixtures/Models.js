import Type from '../../src/type/index.js';

export class LinkedModel extends Type.Model {
    static string = Type.String;
}

export class LinkedManyModel extends Type.Model {
    static string = Type.String;
}

export class CircularModel extends Type.Model {
    static linked = () => MainModel;
}

export class CircularManyModel extends Type.Model {
    static linked = () => Type.Array.of(MainModel);
}

export class MainModel extends Type.Model {
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
    static date = Type.Date;
    static requiredDate = Type.Date.required;
    static emptyArrayOfStrings = Type.Array.of(Type.String);
    static emptyArrayOfNumbers = Type.Array.of(Type.Number);
    static emptyArrayOfBooleans = Type.Array.of(Type.Boolean);
    static emptyArrayOfDates = Type.Array.of(Type.Date);
    static emptyArrayOfModels = Type.Array.of(LinkedManyModel);
    static arrayOfString = Type.Array.of(Type.String);
    static arrayOfNumber = Type.Array.of(Type.Number);
    static arrayOfBoolean = Type.Array.of(Type.Boolean);
    static arrayOfDate = Type.Array.of(Type.Date);
    static requiredArrayOfString = Type.Array.of(Type.String).required;
    static requiredArrayOfNumber = Type.Array.of(Type.Number).required;
    static requiredArrayOfBoolean = Type.Array.of(Type.Boolean).required;
    static requiredArrayOfDate = Type.Array.of(Type.Date).required;
    static circular = CircularModel;
    static circularMany = Type.Array.of(CircularManyModel);
    static linked = () => LinkedModel;
    static requiredLinked = LinkedModel.required;
    static linkedMany = () => Type.Array.of(LinkedManyModel);
    static indexedProperties = () => [
        'string',
        'boolean',
        'number',
        'arrayOfString',
        'stringSlug',
        'linked.string',
        'linkedMany.[*].string',
    ];
    static searchProperties = () => ['string', 'stringSlug', 'linked.string', 'linkedMany.[*].string'];
}
