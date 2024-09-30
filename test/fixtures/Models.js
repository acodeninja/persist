import Type from '../../src/type/index.js';

/**
 * Represents a model with a linked string property.
 *
 * @class LinkedModel
 * @extends {Type.Model}
 * @property {Type.String} string - A string type property.
 * @property {Type.Boolean} boolean - A boolean type property.
 */
export class LinkedModel extends Type.Model {
    static {
        this.setMinifiedName('LinkedModel');
        this.string = Type.String;
        this.boolean = Type.Boolean;
    }
}

/**
 * Represents a model with an array of linked string properties.
 *
 * @class LinkedManyModel
 * @extends {Type.Model}
 * @property {Type.String} string - A string type property.
 */
export class LinkedManyModel extends Type.Model {
    static {
        this.setMinifiedName('LinkedManyModel');
        this.string = Type.String;
    }
}

/**
 * Represents a model with a circular reference to the `MainModel`.
 *
 * @class CircularModel
 * @extends {Type.Model}
 * @property {MainModel} linked - A circular reference to the `MainModel`.
 */
export class CircularModel extends Type.Model {
    static {
        this.setMinifiedName('CircularModel');
        this.linked = () => MainModel;
    }
}

/**
 * Represents a model with an array of circular references to the `MainModel`.
 *
 * @class CircularManyModel
 * @extends {Type.Model}
 * @property {MainModel[]} linked - An array of circular references to the `MainModel`.
 */
export class CircularManyModel extends Type.Model {
    static {
        this.setMinifiedName('CircularManyModel');
        this.linked = () => Type.Array.of(MainModel);
    }
}

/**
 * Represents the main model with various properties including strings, numbers, booleans, dates, arrays,
 * and linked models.
 *
 * @class MainModel
 * @extends {Type.Model}
 * @property {Type.Custom} custom - A custom object with validation rules.
 * @property {Type.String} string - A simple string property.
 * @property {Type.Resolved.Slug} stringSlug - A resolved slug based on a string.
 * @property {Type.String} requiredString - A required string property.
 * @property {Type.Resolved.Slug} requiredStringSlug - A resolved slug based on a required string.
 * @property {Type.Number} number - A number property.
 * @property {Type.Number} requiredNumber - A required number property.
 * @property {Type.Boolean} boolean - A boolean property.
 * @property {Type.Boolean} requiredBoolean - A required boolean property.
 * @property {Type.Date} date - A date property.
 * @property {Type.Date} requiredDate - A required date property.
 * @property {Type.Array<Type.String>} emptyArrayOfStrings - An empty array of strings.
 * @property {Type.Array<Type.Number>} emptyArrayOfNumbers - An empty array of numbers.
 * @property {Type.Array<Type.Boolean>} emptyArrayOfBooleans - An empty array of booleans.
 * @property {Type.Array<Type.Date>} emptyArrayOfDates - An empty array of dates.
 * @property {Type.Array<LinkedManyModel>} emptyArrayOfModels - An empty array of linked models.
 * @property {Type.Array<Type.String>} arrayOfString - An array of strings.
 * @property {Type.Array<Type.Number>} arrayOfNumber - An array of numbers.
 * @property {Type.Array<Type.Boolean>} arrayOfBoolean - An array of booleans.
 * @property {Type.Array<Type.Date>} arrayOfDate - An array of dates.
 * @property {Type.Array<Type.String>} requiredArrayOfString - A required array of strings.
 * @property {Type.Array<Type.Number>} requiredArrayOfNumber - A required array of numbers.
 * @property {Type.Array<Type.Boolean>} requiredArrayOfBoolean - A required array of booleans.
 * @property {Type.Array<Type.Date>} requiredArrayOfDate - A required array of dates.
 * @property {CircularModel} circular - A circular reference to the `CircularModel`.
 * @property {Type.Array<CircularManyModel>} circularMany - An array of circular references to the `CircularManyModel`.
 * @property {LinkedModel} linked - A reference to a `LinkedModel`.
 * @property {LinkedModel} requiredLinked - A required reference to a `LinkedModel`.
 * @property {Type.Array<LinkedManyModel>} linkedMany - An array of references to `LinkedManyModel`.
 * @method indexedProperties Returns the list of properties to be indexed.
 * @method searchProperties Returns the list of properties used in search.
 */
export class MainModel extends Type.Model {
    static {
        this.setMinifiedName('MainModel');
        this.custom = Type.Custom.of({
            type: 'object',
            additionalProperties: false,
            properties: {test: {type: 'string'}},
            required: ['test'],
        });
        this.string = Type.String;
        this.stringSlug = Type.Resolved.Slug.of('string');
        this.requiredString = Type.String.required;
        this.requiredStringSlug = Type.Resolved.Slug.of('requiredString');
        this.number = Type.Number;
        this.requiredNumber = Type.Number.required;
        this.boolean = Type.Boolean;
        this.requiredBoolean = Type.Boolean.required;
        this.date = Type.Date;
        this.requiredDate = Type.Date.required;
        this.emptyArrayOfStrings = Type.Array.of(Type.String);
        this.emptyArrayOfNumbers = Type.Array.of(Type.Number);
        this.emptyArrayOfBooleans = Type.Array.of(Type.Boolean);
        this.emptyArrayOfDates = Type.Array.of(Type.Date);
        this.emptyArrayOfModels = Type.Array.of(LinkedManyModel);
        this.arrayOfString = Type.Array.of(Type.String);
        this.arrayOfNumber = Type.Array.of(Type.Number);
        this.arrayOfBoolean = Type.Array.of(Type.Boolean);
        this.arrayOfDate = Type.Array.of(Type.Date);
        this.requiredArrayOfString = Type.Array.of(Type.String).required;
        this.requiredArrayOfNumber = Type.Array.of(Type.Number).required;
        this.requiredArrayOfBoolean = Type.Array.of(Type.Boolean).required;
        this.requiredArrayOfDate = Type.Array.of(Type.Date).required;
        this.circular = CircularModel;
        this.circularMany = Type.Array.of(CircularManyModel);
        this.linked = LinkedModel;
        this.requiredLinked = () => LinkedModel.required;
        this.linkedMany = Type.Array.of(LinkedManyModel);

        /**
         * Returns the list of properties to be indexed.
         *
         * @returns {string[]} An array of property names to be indexed.
         */
        this.indexedProperties = () => [
            'string',
            'boolean',
            'number',
            'arrayOfString',
            'stringSlug',
            'linked.string',
            'linked.boolean',
            'linkedMany.[*].string',
        ];

        /**
         * Returns the list of properties used in search.
         *
         * @returns {string[]} An array of property names used for search.
         */
        this.searchProperties = () => ['string', 'stringSlug', 'linked.string', 'linkedMany.[*].string'];
    }
}
