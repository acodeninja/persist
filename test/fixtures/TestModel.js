import Type from '../../src/type/index.js';

export const valid = {
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
};

export const invalid = {
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
};

/**
 * @class LinkedModel
 * @extends Type.Model
 * @property {string} string
 */
export class LinkedModel extends Type.Model {
    static string = Type.String;
}

/**
 * @class LinkedManyModel
 * @extends Type.Model
 * @property {string} string
 */
export class LinkedManyModel extends Type.Model {
    static string = Type.String;
}

/**
 * @class MainModel
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
 * @property {CircularModel} circular
 * @property {LinkedModel} linked
 * @property {CircularManyModel[]} circularMany
 * @property {LinkedManyModel[]} linkedMany
 */
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
    static arrayOfString = Type.Array.of(Type.String);
    static arrayOfNumber = Type.Array.of(Type.Number);
    static arrayOfBoolean = Type.Array.of(Type.Boolean);
    static requiredArrayOfString = Type.Array.of(Type.String).required;
    static requiredArrayOfNumber = Type.Array.of(Type.Number).required;
    static requiredArrayOfBoolean = Type.Array.of(Type.Boolean).required;
    static circular = () => CircularModel;
    static circularMany = () => Type.Array.of(CircularManyModel);
    static linked = LinkedModel;
    static requiredLinked = LinkedModel.required;
    static linkedMany = Type.Array.of(LinkedManyModel);
    static indexedProperties = () => ['string', 'stringSlug'];
    static searchProperties = () => ['string'];
}

/**
 * @class CircularModel
 * @extends Type.Model
 * @property {MainModel} linked
 */
export class CircularModel extends Type.Model {
    static linked = MainModel;
}

/**
 * @class CircularManyModel
 * @extends Type.Model
 * @property {MainModel[]} linked
 */
export class CircularManyModel extends Type.Model {
    static linked = Type.Array.of(MainModel);
}

export function getTestModelInstance(data = {}) {
    const model = new MainModel(data);
    if (!data.id) model.id = model.id.replace(/[a-zA-Z0-9]+$/, '000000000000');

    const circular = new CircularModel({linked: model});
    circular.id = circular.id.replace(/[a-zA-Z0-9]+$/, '000000000000');
    model.circular = circular;

    const linked = new LinkedModel({string: 'test'});
    linked.id = linked.id.replace(/[a-zA-Z0-9]+$/, '000000000000');
    model.linked = linked;

    const requiredLinked = new LinkedModel({string: 'test'});
    requiredLinked.id = requiredLinked.id.replace(/[a-zA-Z0-9]+$/, '111111111111');
    model.requiredLinked = requiredLinked;

    const circularMany = new CircularManyModel({linked: [model]});
    circularMany.id = circularMany.id.replace(/[a-zA-Z0-9]+$/, '000000000000');
    model.circularMany = [circularMany];

    const linkedMany = new LinkedManyModel({string: 'many'});
    linkedMany.id = linkedMany.id.replace(/[a-zA-Z0-9]+$/, '000000000000');
    model.linkedMany = [linkedMany];

    if (JSON.stringify(data) === JSON.stringify(invalid)) {
        model.id = model.id.replace(/[a-zA-Z0-9]+$/, 'Not A Valid ID');
        circular.id = circular.id.replace(/[a-zA-Z0-9]+$/, 'Not A Valid ID');
        linked.id = linked.id.replace(/[a-zA-Z0-9]+$/, 'Not A Valid ID');
        circularMany.id = circularMany.id.replace(/[a-zA-Z0-9]+$/, 'Not A Valid ID');
        linkedMany.id = linkedMany.id.replace(/[a-zA-Z0-9]+$/, 'Not A Valid ID');
    }

    return model;
}
